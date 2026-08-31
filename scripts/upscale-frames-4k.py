"""
Upscale SceneCraft laptop animation frames to 4K and crush dark JPG macroblocking.

Input:  public/frames/*.webp (or JPG/PNG)
Output: public/frames_4k/*.webp (high-quality WebP for web playback)
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INPUT_FOLDER = ROOT / "public" / "frames"
OUTPUT_FOLDER = ROOT / "public" / "frames_4k"

TARGET_WIDTH = 3840
DARK_THRESHOLD = 30
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def crush_dark_pixels(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGB"), dtype=np.uint8)
    dark = (
        (arr[:, :, 0] < DARK_THRESHOLD)
        & (arr[:, :, 1] < DARK_THRESHOLD)
        & (arr[:, :, 2] < DARK_THRESHOLD)
    )
    arr[dark] = 0
    return Image.fromarray(arr, mode="RGB")


def upscale_frame(src: Path, dest: Path) -> None:
    img = Image.open(src).convert("RGB")
    aspect_ratio = img.height / img.width
    target_height = int(TARGET_WIDTH * aspect_ratio)
    img_resized = img.resize((TARGET_WIDTH, target_height), Image.Resampling.LANCZOS)
    cleaned = crush_dark_pixels(img_resized)
    dest.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(dest, format="WEBP", quality=95, method=6)


def main() -> None:
    input_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else INPUT_FOLDER
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT_FOLDER

    files = sorted(
        p for p in input_dir.iterdir() if p.suffix.lower() in EXTENSIONS
    )
    if not files:
        raise SystemExit(f"No frame images found in {input_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    total = len(files)

    for index, src in enumerate(files, start=1):
        dest = output_dir / f"{src.stem}.webp"
        upscale_frame(src, dest)
        if index == 1 or index % 25 == 0 or index == total:
            print(f"upscaled {index}/{total} -> {dest.name} ({TARGET_WIDTH}px wide)")

    print(f"Done! {total} frames saved to {output_dir}")


if __name__ == "__main__":
    main()
