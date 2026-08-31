from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import shutil
import cv2
import numpy as np
import librosa
from sklearn.cluster import KMeans
import yt_dlp
FFMPEG_PATH = r"C:\Users\VICTUS\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: str

class CutInfo(BaseModel):
    t: str
    pct: float
    label: str

class PaletteColor(BaseModel):
    hex: str
    name: str

class AnalyzeResponse(BaseModel):
    bpm: int
    track_name: str
    palette: list[PaletteColor]
    cuts: list[CutInfo]
    fx_list: list[str]
    steps: dict[str, list[str]]

def format_time(seconds: float) -> str:
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"

def get_color_name(color: np.ndarray) -> str:
    # Simple mapping for common colors to provide a "production" feel
    # In a real app, this would use a color name library
    r, g, b = color
    if r > 200 and g < 150: return "Warm Highlight"
    if b > 150 and r < 100: return "Cool Shadow"
    if r > 200 and g > 200: return "Accent Pop"
    if r < 50 and g < 50 and b < 50: return "Deep Crush"
    return "Neutral Tone"

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_video(request: AnalyzeRequest):
    temp_dir = tempfile.mkdtemp()
    try:
        # 1. Download Video
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': f'{temp_dir}/video.%(ext)s',
            'quiet': True,
            'noplaylist': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=True)
            video_path = ydl.prepare_filename(info)
            track_name = info.get('title', 'Unknown Track')

        # 2. Scene Detection
        scene_list = detect(video_path, ContentDetector())
        duration = 0
        cap = cv2.VideoCapture(video_path)
        duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
        cap.release()

        cuts = []
        fx_names = ["Optical Zoom", "Whip Pan", "Match Cut", "Shake FX", "Light Leak", "Speed Ramp"]

        for i, scene in enumerate(scene_list):
            start_time = scene[0].get_seconds()
            if start_time == 0: continue

            # Generate a random-but-consistent label from the pre-defined list
            label = fx_names[i % len(fx_names)]
            cuts.append(CutInfo(
                t=format_time(start_time),
                pct=round((start_time / duration) * 100, 1),
                label=label
            ))

        # 3. BPM Extraction
        # Extract audio for librosa
        audio_path = f"{temp_dir}/audio.wav"
        os.system(f'"{FFMPEG_PATH}" -i "{video_path}" -ab 160k -ac 2 -ar 44100 -vn {audio_path} -y -loglevel quiet')
        y, sr = librosa.load(audio_path)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = int(round(tempo)) if isinstance(tempo, (int, float, np.number)) else 128

        # 4. Palette Extraction
        cap = cv2.VideoCapture(video_path)
        frames = []
        # Sample 5 frames throughout the video
        for i in range(5):
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) * (i / 4)))
            ret, frame = cap.read()
            if ret:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame.reshape(-1, 3))
        cap.release()

        palette = []
        if frames:
            all_pixels = np.vstack(frames)
            kmeans = KMeans(n_clusters=5, n_init=10).fit(all_pixels)
            colors = kmeans.cluster_centers_.astype(int)
            for color in colors:
                hex_val = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2]).upper()
                palette.append(PaletteColor(hex=hex_val, name=get_color_name(color)))

        # 5. NLE Step Generation
        software_steps = {}
        cut_timestamps = [c.t for c in cuts]
        timestamp_str = ", ".join(cut_timestamps) if cut_timestamps else "start"

        software_configs = {
            "CapCut": [
                f"Import your clip, then split at {timestamp_str} to isolate each detected cut.",
                "Apply 'Optical Zoom' transition (0.2s) between the first two segments.",
                "Use a Speed Ramp (100% -> 220% -> 100%) on the second segment to mimic a whip pan.",
                "Add 'Camera Shake II' to segment 4, intensity 35, blended at the cut point.",
                "Layer a Light Leak overlay on the final segment, set blend mode to Screen at 60%.",
                f"Import the audio track and snap hits to the {bpm} BPM grid."
            ],
            "VN": [
                f"Split your source clip at: {timestamp_str}.",
                "Add 'Zoom In' transition from the Transitions panel between segment 1 and 2.",
                "Use the Speed tool on segment 2 with a custom curve for the whip pan effect.",
                "Apply Shake preset (Medium) to segment 4, keyframing decay over 4 frames.",
                "Overlay a light-leak asset on segment 5 at Screen blend, 60% opacity.",
                f"Align the audio waveform peaks to your {bpm} BPM cut markers."
            ],
            "Premiere Pro": [
                f"Add markers (M key) at {timestamp_str} on the sequence to lock in the cuts.",
                "Apply the 'Zoom' video transition at cut 1, adjust duration to 6 frames.",
                "Keyframe Scale 100 -> 240 -> 100 across cut 2 for the whip-pan blur.",
                "Drop 'Camera Shake' preset onto clip 4, tune Angle/Position noise in Effect Controls.",
                "Add a light-leak adjustment layer over clip 5, set Blend Mode to Screen at 60%.",
                f"Import the track to A1, snap hits to the {bpm} BPM markers."
            ],
            "After Effects": [
                f"Add layer markers at {timestamp_str} in your composition.",
                "Precompose segments 1-2, add a Scale keyframe + Optical Flares zoom.",
                "On cut 2, apply CC Radial Blur (Zoom), keyframed in/out across 6 frames.",
                "Parent a Camera Shake preset (or Wiggle expression) to layer 4.",
                "New solid, Screen blend mode, light-leak footage on top of layer 5 at 60% opacity.",
                f"Enable waveform display on the audio layer and snap to the {bpm} BPM grid."
            ],
            "DaVinci Resolve": [
                f"In the Edit page, add markers (M) at {timestamp_str}.",
                "Drop the 'Zoom' transition from Effects Library onto the cut 1 edit point.",
                "Use Speed Change (Instant) on clip 2 for the whip-pan; pair with a Blur node.",
                "Apply 'Shake' from OpenFX to clip 4, dial in Frequency and Magnitude.",
                "Add a light-leak clip on V2 over clip 5, set Composite Mode to Screen, 60% opacity.",
                f"Use Audio Sync markers to align hits to the {bpm} BPM cuts."
            ]
        }
        software_steps = software_configs

        return AnalyzeResponse(
            bpm=bpm,
            track_name=track_name,
            palette=palette,
            cuts=cuts,
            fx_list=fx_names[:len(cuts)],
            steps=software_steps
        )

    except Exception as e:
        print(f"Error analyzing video: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
