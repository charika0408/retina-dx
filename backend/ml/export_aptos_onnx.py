"""Export the trained APTOS EfficientNet-B0 checkpoint to ONNX for offline mobile inference.

Example:
  python backend/ml/export_aptos_onnx.py \
    --checkpoint backend/models/aptos_efficientnet_b0.pt \
    --output frontend/assets/models/aptos_efficientnet_b0.onnx
"""
from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch import nn
from torchvision import models


def build_model(num_classes: int = 5):
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, default=Path("backend/models/aptos_efficientnet_b0.pt"))
    parser.add_argument("--output", type=Path, default=Path("frontend/assets/models/aptos_efficientnet_b0.onnx"))
    args = parser.parse_args()

    if not args.checkpoint.exists():
        raise FileNotFoundError(f"Checkpoint not found: {args.checkpoint}")

    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=False)
    model = build_model(int(checkpoint.get("num_classes", 5)))
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    dummy = torch.randn(1, 3, 224, 224)

    torch.onnx.export(
        model,
        dummy,
        args.output,
        input_names=["input"],
        output_names=["logits"],
        opset_version=17,
        do_constant_folding=True,
    )

    print(f"Saved ONNX model: {args.output}")
    print("Copy this file into the Expo app before building the APK.")


if __name__ == "__main__":
    main()
