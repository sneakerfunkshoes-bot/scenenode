#!/usr/bin/env python3
"""
Append a subtle "Made on SceneNode" end-card badge for the final ~2 seconds.

Requires ffmpeg on PATH.

Usage:
  python scripts/ffmpeg_endcard_watermark.py input.mp4 output.mp4
  python scripts/ffmpeg_endcard_watermark.py input.mp4 output.mp4 --label "Made on SceneNode"
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys


def probe_duration(path: str) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "json",
        path,
    ]
    raw = subprocess.check_output(cmd, text=True)
    data = json.loads(raw)
    return float(data["format"]["duration"])


def build_filter(duration: float, label: str) -> str:
    start = max(0.0, duration - 2.0)
    # Fade in over 0.4s near the end, hold through end.
    # drawtext needs a font; on Windows/macOS ffmpeg often has a default.
    safe = label.replace(":", "\\:").replace("'", "\\'")
    return (
        f"drawtext=text='{safe}':fontsize=28:fontcolor=white@0.85:"
        f"x=(w-text_w)/2:y=h-th-48:"
        f"enable='gte(t\\,{start})':"
        f"alpha='if(lt(t\\,{start}+0.4)\\,(t-{start})/0.4\\,0.85)'"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--label", default="Made on SceneNode")
    args = parser.parse_args()

    try:
        duration = probe_duration(args.input)
    except Exception as exc:  # noqa: BLE001
        print(f"ffprobe failed: {exc}", file=sys.stderr)
        return 1

    vf = build_filter(duration, args.label)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        args.input,
        "-vf",
        vf,
        "-codec:a",
        "copy",
        args.output,
    ]
    print(" ".join(cmd))
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
