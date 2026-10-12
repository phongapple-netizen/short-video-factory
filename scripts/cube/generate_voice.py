"""Reuse narration by default; --fresh regenerates the original spoken copy."""
import argparse
import json
import os
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("--fresh", action="store_true", help="Regenerate the original Edge-TTS voice files first")
args = parser.parse_args()
if args.fresh:
    rows = json.loads((root / "src/videos/cube/captions-v2.json").read_text(encoding="utf-8"))
    for row in rows:
        path = root / "public" / row["audio"]
        temporary = path.with_name(path.stem + ".temporary.mp3")
        command = ["edge-tts", "--voice", "zh-CN-XiaoxiaoNeural", "--rate",
                   "+50%" if row["scene"] == "layers" else "+25%",
                   "--text", row.get("voiceText", row["text"]),
                   "--write-media", str(temporary)]
        proxy = os.environ.get("HTTPS_PROXY")
        if proxy:
            command += ["--proxy", proxy]
        # Preserve working audio if the remote service rejects a request.
        subprocess.run(command, check=True)
        temporary.replace(path)
subprocess.run(["python", str(root / "scripts/cube/prepare_douyin_audio.py")], check=True)
