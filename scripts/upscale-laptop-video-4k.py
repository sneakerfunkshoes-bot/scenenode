"""
Upscale SceneCraft laptop hero video to 4K (3840px wide) with Lanczos + high bitrate H.264.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "public" / "videos" / "laptop-animation.mp4"
OUTPUT = ROOT / "public" / "videos" / "laptop-animation-4k.mp4"
TARGET_WIDTH = 3840


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else INPUT
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT

    if not src.exists():
        raise SystemExit(f"Missing input video: {src}")

    cap = cv2.VideoCapture(str(src))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {src}")

    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    cap.release()

    target_h = int(round(TARGET_WIDTH * (src_h / src_w)))
    # Keep even dimensions for H.264
    if target_h % 2:
        target_h += 1

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    dest.parent.mkdir(parents=True, exist_ok=True)

    print(f"Input:  {src} ({src_w}x{src_h} @ {fps:.2f}fps, ~{frame_count} frames)")
    print(f"Output: {dest} ({TARGET_WIDTH}x{target_h})")
    print(f"FFmpeg: {ffmpeg}")

    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(src),
        "-vf",
        f"scale={TARGET_WIDTH}:{target_h}:flags=lanczos,unsharp=5:5:0.6:5:5:0.0",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        str(dest),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr[-2000:] if result.stderr else "ffmpeg failed")
        raise SystemExit(result.returncode)

    size_mb = dest.stat().st_size / (1024 * 1024)
    print(f"Done. Wrote {dest.name} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
