"""Train a 5-class diabetic-retinopathy classifier on APTOS 2019.

Expected data layout:
  data/aptos2019/train.csv
  data/aptos2019/train_images/*.png

train.csv contains: id_code,diagnosis where diagnosis is 0..4.

Example:
  python backend/ml/train_aptos.py --data-dir data/aptos2019 --epochs 12 --batch-size 16
"""
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import cohen_kappa_score, classification_report
from torch import nn
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import models, transforms

SEED = 42
CLASS_NAMES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]


def seed_everything(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


class AptosDataset(Dataset):
    def __init__(self, frame: pd.DataFrame, image_dir: Path, transform):
        self.frame = frame.reset_index(drop=True)
        self.image_dir = image_dir
        self.transform = transform

    def __len__(self):
        return len(self.frame)

    def __getitem__(self, index):
        row = self.frame.iloc[index]
        path = self.image_dir / f"{row.id_code}.png"
        if not path.exists():
            path = self.image_dir / str(row.id_code)
        image = Image.open(path).convert("RGB")
        return self.transform(image), int(row.diagnosis)


def build_model(num_classes: int = 5):
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("backend/models/aptos_efficientnet_b0.pt"))
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--val-size", type=float, default=0.2)
    parser.add_argument("--workers", type=int, default=2)
    args = parser.parse_args()
    seed_everything()

    csv_path = args.data_dir / "train.csv"
    image_dir = args.data_dir / "train_images"
    if not csv_path.exists() or not image_dir.exists():
        raise FileNotFoundError("Expected train.csv and train_images/ under --data-dir")

    df = pd.read_csv(csv_path)
    required = {"id_code", "diagnosis"}
    if not required.issubset(df.columns):
        raise ValueError(f"train.csv must contain {required}; found {list(df.columns)}")

    train_df, val_df = train_test_split(
        df, test_size=args.val_size, stratify=df.diagnosis, random_state=SEED
    )

    train_tfms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(12),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tfms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    train_ds = AptosDataset(train_df, image_dir, train_tfms)
    val_ds = AptosDataset(val_df, image_dir, val_tfms)
    counts = train_df.diagnosis.value_counts().sort_index().reindex(range(5), fill_value=1)
    sample_weights = train_df.diagnosis.map({i: 1.0 / float(counts[i]) for i in range(5)}).to_numpy()
    sampler = WeightedRandomSampler(torch.as_tensor(sample_weights, dtype=torch.double), len(sample_weights), replacement=True)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler, num_workers=args.workers, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.workers, pin_memory=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")

    best_kappa = -1.0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    history = []

    for epoch in range(args.epochs):
        model.train()
        train_loss = 0.0
        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device.type, enabled=device.type == "cuda"):
                logits = model(images)
                loss = criterion(logits, targets)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            train_loss += loss.item() * images.size(0)

        model.eval()
        y_true, y_pred = [], []
        val_loss = 0.0
        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                logits = model(images)
                val_loss += criterion(logits, targets).item() * images.size(0)
                y_true.extend(targets.cpu().tolist())
                y_pred.extend(logits.argmax(1).cpu().tolist())
        kappa = cohen_kappa_score(y_true, y_pred, weights="quadratic")
        row = {"epoch": epoch + 1, "train_loss": train_loss / len(train_ds), "val_loss": val_loss / len(val_ds), "quadratic_weighted_kappa": float(kappa)}
        history.append(row)
        print(row)
        if kappa > best_kappa:
            best_kappa = kappa
            torch.save({
                "model_state": model.state_dict(),
                "architecture": "efficientnet_b0",
                "num_classes": 5,
                "class_names": CLASS_NAMES,
                "image_size": 224,
                "mean": [0.485, 0.456, 0.406],
                "std": [0.229, 0.224, 0.225],
                "best_qwk": float(kappa),
            }, args.output)

    report = classification_report(y_true, y_pred, target_names=CLASS_NAMES, output_dict=True, zero_division=0)
    metrics = {"best_qwk": best_kappa, "classification_report": report, "history": history}
    metrics_path = args.output.with_suffix(".metrics.json")
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved model: {args.output}")
    print(f"Saved metrics: {metrics_path}")


if __name__ == "__main__":
    main()
