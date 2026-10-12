"""Reuse existing Edge-TTS narration; keep spoken text separate from captions."""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[2]
source = json.loads((root / "src/videos/cube/captions-v2.json").read_text(encoding="utf-8"))
timeline = json.loads((root / "src/videos/cube/timeline.json").read_text(encoding="utf-8"))
target_dir = root / "public/assets/cube/audio/douyin"
target_dir.mkdir(parents=True, exist_ok=True)
display = {
    "c1_01": "棱长5厘米，体积是多少？",
    "c1_03": "挖后还剩多少？用1厘米方格来数。",
    "c2_01": "第1个孔贯穿5层，每层挖去5格，共25个小方块。",
    "c2_02": "第2个孔与已有空洞重叠，只新增挖去14个。",
    "c2_03": "还剩：125−25−14=86。",
    "c2_04": "第3个方向再新增挖去10个小方块。",
    "c2_05": "3个方向合计挖去49个。",
    "c3_01": "把剩余部分按高度分成5层。",
    "c3_02": "5层依次是20、16、4、16、20格。",
    "c4_01": "第1层，20个。", "c4_02": "第2层，16个。",
    "c4_03": "第3层，4个。", "c4_04": "第4层，16个。",
    "c4_05": "第5层，20个。", "c4_06": "按层数清楚，再把5层相加。",
    "c5_01": "20+16+4+16+20=76。",
    "c5_02": "验算：原有125个，挖去49个，剩余76个。",
    "c5_03": "每格1立方厘米，剩余体积是76立方厘米。",
}
result = []
for scene in ("question", "drill", "layers", "count", "answer"):
    rows = [row for row in source if row["scene"] == scene and row["id"] != "c1_02"]
    speed = 1.10 if scene == "question" else 1.25 if scene == "answer" else 1.0
    clips = []
    for row in rows:
        cue_id = row["id"]
        output = target_dir / f"{cue_id}.wav"
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(root / "public" / row["audio"]),
            "-af", f"atempo={speed}", "-ar", "48000", "-ac", "1",
            "-c:a", "pcm_s16le", str(output),
        ], check=True)
        duration = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(output),
        ], text=True))
        clips.append((row, duration, output))
    start, end = timeline[scene]["start"], timeline[scene]["end"]
    total = sum(duration for _, duration, _ in clips)
    assert total <= end - start, (scene, total, end - start)
    gap = (end - start - total) / (len(clips) + 1)
    cursor = start + (0.1 if scene == "question" else gap)
    for row, duration, output in clips:
        result.append({
            "id": row["id"], "text": display[row["id"]],
            "voiceText": row.get("voiceText", row["text"]),
            "scene": scene, "start": round(cursor, 6),
            "end": round(cursor + duration, 6), "duration": round(duration, 6),
            "playbackRate": speed, "audio": str(output.relative_to(root / "public")),
        })
        cursor += duration + gap
    assert cursor - gap <= end
assert all(a["end"] <= b["start"] for a, b in zip(result, result[1:]))
(root / "src/videos/cube/captions.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Prepared {len(result)} existing Edge-TTS clips for a {timeline['ending']['end']}s video.")
