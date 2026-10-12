"""Two-pass loudnorm, followed by measurement of the encoded AAC true peak."""
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
audio_profile = json.loads((root / 'standards/douyin-profile.json').read_text())['audio']
target_i = audio_profile['integrated_lufs']
max_peak = audio_profile['maximum_true_peak_dbtp']
lra = audio_profile['lra_target']
input_path = root / (sys.argv[1] if len(sys.argv) > 1 else "out/raw.mp4")
output_path = root / (sys.argv[2] if len(sys.argv) > 2 else "out/final.mp4")

report_dir = output_path.parent
report_dir.mkdir(parents=True, exist_ok=True)

def run(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args],
                          capture_output=True, text=True, check=True).stderr

def stats(log):
    return json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', log, re.S)[-1])

def measured(log):
    summary = log.rsplit("Summary:", 1)[-1]
    integrated = float(re.search(r"Integrated loudness:\s*I:\s*(-?[\d.]+)", summary).group(1))
    peak = float(re.search(r"True peak:\s*Peak:\s*(-?[\d.]+)", summary).group(1))
    return integrated, peak

for target_peak in (audio_profile['normalization_peak_target_dbtp'] - i * 0.4 for i in range(3)):
    first = stats(run(["-i", str(input_path), "-vn", "-af",
                       f"loudnorm=I={target_i}:TP={target_peak}:LRA={lra}:print_format=json",
                       "-f", "null", "-"]))
    loudnorm = (
        f"loudnorm=I={target_i}:TP={target_peak}:LRA={lra}:"
        f"measured_I={first['input_i']}:measured_TP={first['input_tp']}:"
        f"measured_LRA={first['input_lra']}:measured_thresh={first['input_thresh']}:"
        f"offset={first['target_offset']}:linear=true:print_format=json"
    )
    second = stats(run(["-y", "-i", str(input_path), "-map", "0:v:0", "-map", "0:a:0",
                        "-c:v", "copy", "-af", loudnorm, "-ar", "48000", "-c:a", "aac",
                        "-b:a", "192k", "-movflags", "+faststart", str(output_path)]))
    log = run(["-i", str(output_path), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"])
    (report_dir / "ebur128.log").write_text(log, encoding="utf-8")
    integrated, peak = measured(log)
    correction = 0.0
    # Measure the encoded AAC rather than trusting loudnorm's own estimate.
    # Re-encode from the original input when a small gain correction fits the peak budget.
    gain = target_i - integrated
    if abs(gain) > 0.3 and abs(gain) <= 1.5 and peak + gain <= max_peak - 0.1:
        correction = gain
        second = stats(run(["-y", "-i", str(input_path), "-map", "0:v:0", "-map", "0:a:0",
                            "-c:v", "copy", "-af", loudnorm + f",volume={gain}dB",
                            "-ar", "48000", "-c:a", "aac", "-b:a", "192k",
                            "-movflags", "+faststart", str(output_path)]))
        log = run(["-i", str(output_path), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"])
        (report_dir / "ebur128.log").write_text(log, encoding="utf-8")
        integrated, peak = measured(log)
    if abs(integrated - target_i) <= audio_profile['lufs_tolerance'] and peak <= max_peak:
        report = {"integrated_lufs": integrated, "true_peak_dbtp": peak,
                  "target_true_peak": target_peak, "encoded_gain_correction_db": correction,
                  "first_pass": first, "second_pass": second}
        (report_dir / "audio-report.json").write_text(json.dumps(report, indent=2) + "\n")
        print(f"Verified encoded AAC: {integrated:.1f} LUFS, true peak {peak:.1f} dBTP.")
        break
else:
    raise RuntimeError("The encoded AAC did not meet -15 LUFS / <= -1.5 dBTP.")
