"""Download the official APTOS 2019 Blindness Detection competition data.

Kaggle credentials and acceptance of the competition rules are required.
Run: python backend/ml/download_aptos.py --output data/aptos2019
"""
from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import zipfile

from kaggle.api.kaggle_api_extended import KaggleApi


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/aptos2019"))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    raw = args.output / "_raw"
    raw.mkdir(exist_ok=True)
    train_csv = raw / "train.csv"
    train_zip = raw / "train.zip"
    legacy_train_zip = raw / "train_images.zip"

    # Reuse an already downloaded/extracted archive when a previous run stopped
    # after extracting the outer Kaggle ZIP. This avoids downloading ~10 GB again.
    if not train_csv.exists() or not (train_zip.exists() or legacy_train_zip.exists()):
        api = KaggleApi()
        api.authenticate()
        api.competition_download_files(
            "aptos2019-blindness-detection", path=str(args.output), quiet=False
        )
        outer = args.output / "aptos2019-blindness-detection.zip"
        if not outer.exists():
            candidates = list(args.output.glob("*.zip"))
            if not candidates:
                raise FileNotFoundError(
                    "Kaggle download completed but no competition ZIP archive was found"
                )
            outer = candidates[0]

        with zipfile.ZipFile(outer) as zf:
            zf.extractall(raw)
        outer.unlink(missing_ok=True)

    train_csv = raw / "train.csv"
    train_zip = raw / "train.zip"
    legacy_train_zip = raw / "train_images.zip"

    if not train_csv.exists():
        raise FileNotFoundError("Expected train.csv was not found in the Kaggle archive")

    # Kaggle's current competition download exposes train.zip; older mirrors
    # used train_images.zip. Support both layouts.
    image_archive = train_zip if train_zip.exists() else legacy_train_zip
    train_images = args.output / "train_images"
    train_images.mkdir(exist_ok=True)

    if image_archive.exists():
        with zipfile.ZipFile(image_archive) as zf:
            zf.extractall(train_images)
    else:
        # Some Kaggle downloads may already contain the image directory.
        source_dir = raw / "train_images"
        if not source_dir.exists():
            raise FileNotFoundError(
                "Expected train.zip/train_images.zip or train_images directory was not found"
            )
        for item in source_dir.iterdir():
            target = train_images / item.name
            if item.is_dir():
                shutil.copytree(item, target, dirs_exist_ok=True)
            else:
                shutil.copy2(item, target)

    shutil.copy2(train_csv, args.output / "train.csv")
    shutil.rmtree(raw, ignore_errors=True)
    print(f"APTOS 2019 training data extracted to {args.output}")


if __name__ == "__main__":
    main()
