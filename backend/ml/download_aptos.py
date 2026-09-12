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
    api = KaggleApi()
    api.authenticate()
    api.competition_download_files("aptos2019-blindness-detection", path=str(args.output), quiet=False)
    outer = args.output / "aptos2019-blindness-detection.zip"
    if not outer.exists():
        candidates = list(args.output.glob("*.zip"))
        if not candidates:
            raise FileNotFoundError("Kaggle download completed but no competition ZIP archive was found")
        outer = candidates[0]

    raw = args.output / "_raw"
    raw.mkdir(exist_ok=True)
    with zipfile.ZipFile(outer) as zf:
        zf.extractall(raw)
    outer.unlink(missing_ok=True)

    train_csv = raw / "train.csv"
    train_zip = raw / "train_images.zip"
    if not train_csv.exists() or not train_zip.exists():
        raise FileNotFoundError("Expected train.csv and train_images.zip were not found in the Kaggle archive")

    shutil.copy2(train_csv, args.output / "train.csv")
    train_images = args.output / "train_images"
    train_images.mkdir(exist_ok=True)
    with zipfile.ZipFile(train_zip) as zf:
        zf.extractall(train_images)

    shutil.rmtree(raw, ignore_errors=True)
    print(f"APTOS 2019 training data extracted to {args.output}")


if __name__ == "__main__":
    main()
