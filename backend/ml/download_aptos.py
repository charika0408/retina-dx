"""Download the APTOS 2019 dataset using the Kaggle API.

1. Create a Kaggle API token and place kaggle.json in ~/.kaggle/.
2. Run: python backend/ml/download_aptos.py --output data/aptos2019
"""
from __future__ import annotations

import argparse
from pathlib import Path
import zipfile

from kaggle.api.kaggle_api_extended import KaggleApi


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/aptos2019"))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    api = KaggleApi()
    api.authenticate()
    archive = args.output / "aptos2019.zip"
    api.dataset_download_files("kmader/aptos2019", path=str(args.output), unzip=False)
    # Kaggle names the downloaded archive aptos2019.zip for this dataset.
    if not archive.exists():
        candidates = list(args.output.glob("*.zip"))
        if not candidates:
            raise FileNotFoundError("Kaggle download completed but no ZIP archive was found")
        archive = candidates[0]
    with zipfile.ZipFile(archive) as zf:
        zf.extractall(args.output)
    archive.unlink(missing_ok=True)
    print(f"APTOS 2019 extracted to {args.output}")


if __name__ == "__main__":
    main()
