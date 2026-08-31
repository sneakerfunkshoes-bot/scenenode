"""
Batch-clean SceneCraft laptop frames:
- crush dark JPEG noise to pure black
- paint out the bottom-right sparkle watermark
- save high-quality WebP for HDPI canvas playback
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image

INPUT_FOLDER = Path(r"C:\Users\VICTUS\Downloads\ezgif-75097c206500ac4a-jpg")
OUTPUT_FOLDER = Path(r"C:\Users\VICTUS\Desktop\Velop\public\frames")
DARK_THRESHOLD = 42
FLOOR_THRESHOLD = 62
FLOOR_RATIO = 0.72
# Tight box around the sparkle icon (not the whole corner — later frames zoom in)
WATERMARK_X0 = 0.885
WATERMARK_Y0 = 0.795
WATERMARK_X1 = 0.928
WATERMARK_Y1 = 0.868


def clean_frame(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGB"), dtype=np.uint8)
    height, width = arr.shape[:2]

    dark = (
        (arr[:, :, 0] < DARK_THRESHOLD)
        & (arr[:, :, 1] < DARK_THRESHOLD)
        & (arr[:, :, 2] < DARK_THRESHOLD)
    )
    arr[dark] = 0

    floor_y = int(height * FLOOR_RATIO)
    floor = arr[floor_y:, :, :]
    floor_dark = (
        (floor[:, :, 0] < FLOOR_THRESHOLD)
        & (floor[:, :, 1] < FLOOR_THRESHOLD)
        & (floor[:, :, 2] < FLOOR_THRESHOLD)
    )
    floor[floor_dark] = 0
    arr[floor_y:, :, :] = floor

    x0 = int(width * WATERMARK_X0)
    y0 = int(height * WATERMARK_Y0)
    x1 = int(width * WATERMARK_X1)
    y1 = int(height * WATERMARK_Y1)
    arr[y0:y1, x0:x1] = 0

    return Image.fromarray(arr, mode="RGB")


def main() -> None:
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    files = sorted(
        p
        for p in INPUT_FOLDER.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if not files:
        raise SystemExit(f"No frames found in {INPUT_FOLDER}")

    for index, src in enumerate(files, start=1):
        cleaned = clean_frame(Image.open(src))
        dest = OUTPUT_FOLDER / f"frame-{index:03d}.webp"
        cleaned.save(dest, format="WEBP", quality=92, method=4)
        if index == 1 or index % 50 == 0 or index == len(files):
            print(f"cleaned {index}/{len(files)} -> {dest.name}")

    print(f"All frames cleaned and saved to {OUTPUT_FOLDER}")


if __name__ == "__main__":
    main()
