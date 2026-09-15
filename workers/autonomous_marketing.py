#!/usr/bin/env python3
"""
SceneNode autonomous marketing worker.

Owns the growth loop for creator-owned renders:
  1) (optional) append Made on SceneNode end-card via FFmpeg helper
  2) generate a fresh Reel caption with Gemini
  3) schedule to Instagram via Buffer
  4) emit ops telemetry

Cron example (daily 09:00 UTC):
  0 9 * * * cd /path/to/Velop && python workers/autonomous_marketing.py >> /var/log/scenenode-marketing.log 2>&1

Env:
  GEMINI_API_KEY           Caption generation (falls back to static caption if missing)
  GEMINI_MODEL             Default: gemini-2.5-flash
  BUFFER_ACCESS_TOKEN      Buffer API token
  BUFFER_PROFILE_IDS       Comma-separated Buffer profile IDs (your IG pages)
  SCENENODE_VIDEO_URLS     Comma-separated public HTTPS URLs of branded renders
  SCENENODE_VIDEO_THEME    Theme string for caption generation
  SCENENODE_PUBLISH=1      Actually POST to Buffer (otherwise dry-run)
  SCENENODE_OPS_WEBHOOK    Optional telemetry webhook
  SCENENODE_OPS_SECRET     Optional x-ops-secret header
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FALLBACK_CAPTION = (
    "rate this edit 🔥 link in bio to try scenenode #edit #scenenode #aesthetic"
)


def _split_csv(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def generate_viral_caption(video_theme: str = "aesthetic celebrity edit") -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[caption] GEMINI_API_KEY missing — using fallback caption")
        return FALLBACK_CAPTION

    try:
        import google.generativeai as genai  # type: ignore
    except ImportError:
        print("[caption] google-generativeai not installed — using fallback caption")
        return FALLBACK_CAPTION

    try:
        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
        model = genai.GenerativeModel(model_name)
        prompt = f"""
Write a short, high-engagement Instagram Reels caption for a viral aesthetic video about: {video_theme}.
Include trendy hook text, casual formatting (lowercase friendly style), and 3-4 relevant hashtags.
Mention SceneNode only if it fits naturally (e.g. link in bio / remix).
Keep it concise and punchy. Return caption text only — no quotes or preamble.
""".strip()
        response = model.generate_content(prompt)
        text = (getattr(response, "text", None) or "").strip()
        return text or FALLBACK_CAPTION
    except Exception as exc:  # noqa: BLE001
        print("[caption] Gemini error:", exc)
        return FALLBACK_CAPTION


def apply_scenenode_endcard(input_path: str, output_path: str) -> str:
    """
    Brand the export with Made on SceneNode (additive watermark only).
    Skips quietly if ffmpeg helper or binary is unavailable.
    """
    helper = ROOT / "scripts" / "ffmpeg_endcard_watermark.py"
    if not helper.is_file():
        print("[brand] endcard helper missing — skipping")
        return input_path
    if not Path(input_path).is_file():
        print("[brand] local input missing — skipping endcard (remote URL publishes as-is)")
        return input_path

    try:
        code = subprocess.call(
            [sys.executable, str(helper), input_path, output_path, "--label", "Made on SceneNode"]
        )
        if code == 0 and Path(output_path).is_file():
            print(f"[brand] endcard applied -> {output_path}")
            return output_path
        print("[brand] endcard failed — continuing with original")
    except Exception as exc:  # noqa: BLE001
        print("[brand] endcard error:", exc)
    return input_path


def push_to_buffer(video_url: str, caption: str, buffer_profile_ids: list[str]) -> list[str]:
    access_token = os.environ.get("BUFFER_ACCESS_TOKEN", "").strip()
    if not access_token:
        print("[buffer] BUFFER_ACCESS_TOKEN missing")
        return []
    if not buffer_profile_ids:
        print("[buffer] no profile IDs configured")
        return []

    publish = os.environ.get("SCENENODE_PUBLISH") == "1"
    if not publish:
        print(
            f"[dry-run] would schedule to Buffer profiles {buffer_profile_ids}: "
            f"{caption[:64]}… | video={video_url}"
        )
        return []

    url = "https://api.bufferapp.com/1/updates/create.json"
    scheduled: list[str] = []

    try:
        import requests  # type: ignore
    except ImportError:
        print("[buffer] requests not installed — pip install requests")
        return []

    for profile_id in buffer_profile_ids:
        payload = {
            "access_token": access_token,
            "profile_ids[]": profile_id,
            "text": caption,
            "media[video]": video_url,
        }
        try:
            response = requests.post(url, data=payload, timeout=60)
            result: dict[str, Any] = response.json() if response.content else {}
            if result.get("success"):
                print(f"[buffer] scheduled profile {profile_id}")
                scheduled.append(profile_id)
            else:
                print(f"[buffer] failed profile {profile_id}:", result)
        except Exception as exc:  # noqa: BLE001
            print(f"[buffer] network error for {profile_id}:", exc)

    return scheduled


def emit_ops_event(event_type: str, metrics: dict[str, Any]) -> None:
    webhook = os.environ.get("SCENENODE_OPS_WEBHOOK", "").strip()
    payload = {
        "project_name": "scenenode",
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "metrics": metrics,
    }
    if not webhook:
        print("[telemetry]", json.dumps(payload))
        return
    headers = {"Content-Type": "application/json"}
    secret = os.environ.get("SCENENODE_OPS_SECRET", "").strip()
    if secret:
        headers["x-ops-secret"] = secret
    req = urllib.request.Request(
        webhook,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        print("[telemetry] forwarded", res.status)


def run_marketing_pipeline(
    video_url: str,
    theme_description: str,
    profile_ids: list[str],
) -> dict[str, Any]:
    print("1. Generating viral caption with Gemini...")
    caption = generate_viral_caption(theme_description)
    print(f"Generated caption:\n{caption}\n")

    print("2. Dispatching branded video to Buffer...")
    scheduled = push_to_buffer(video_url, caption, profile_ids)
    return {"caption": caption, "scheduled_profiles": scheduled}


def run_autonomous_marketing_loop() -> None:
    theme = os.environ.get("SCENENODE_VIDEO_THEME", "dark mood aesthetic celeb transition").strip()
    profile_ids = _split_csv(os.environ.get("BUFFER_PROFILE_IDS", ""))
    video_urls = _split_csv(os.environ.get("SCENENODE_VIDEO_URLS", ""))

    if not video_urls:
        # Local dry-run placeholders — Buffer needs public HTTPS URLs for live publish.
        out_dir = Path("/tmp/scenenode-auto") if os.name != "nt" else ROOT / ".cache" / "auto-edits"
        out_dir.mkdir(parents=True, exist_ok=True)
        sample = out_dir / "auto_edit_0.mp4"
        if not sample.is_file():
            sample.write_bytes(b"")
        branded = apply_scenenode_endcard(str(sample), str(out_dir / "auto_edit_0_branded.mp4"))
        video_urls = [branded]
        print(
            "[warn] SCENENODE_VIDEO_URLS empty — using local placeholder. "
            "Set public HTTPS URLs of creator-owned branded renders for live Buffer posts."
        )

    if not profile_ids:
        print("[warn] BUFFER_PROFILE_IDS empty — captions will still run; Buffer will no-op")

    results: list[dict[str, Any]] = []
    for video_url in video_urls:
        results.append(run_marketing_pipeline(video_url, theme, profile_ids))

    scheduled_flat = [pid for r in results for pid in r["scheduled_profiles"]]
    emit_ops_event(
        "auto_publish_completed",
        {
            "videos_queued": len(video_urls),
            "profiles_scheduled": scheduled_flat or ["dry-run"],
            "theme": theme,
            "publish_enabled": os.environ.get("SCENENODE_PUBLISH") == "1",
            "server_status": "healthy",
        },
    )


if __name__ == "__main__":
    try:
        run_autonomous_marketing_loop()
    except Exception as exc:  # noqa: BLE001
        print("ERROR", exc, file=sys.stderr)
        try:
            emit_ops_event("auto_publish_failed", {"error": str(exc), "server_status": "error"})
        except Exception:  # noqa: BLE001
            pass
        sys.exit(1)
