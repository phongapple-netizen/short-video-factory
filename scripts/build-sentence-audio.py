"""Build single timeline-accurate audio file for SentenceStructure."""
import json, subprocess
from pathlib import Path

root = Path('/home/hatch/workspace/short-video-factory')
rt = json.loads((root / 'src/videos/sentence-structure/runtime.json').read_text())

inputs = []
filters = []
for i, cap in enumerate(rt['captions']):
    p = root / 'public' / cap['_file']
    inputs += ['-i', str(p)]
    delay_ms = int(cap['start'] * 1000)
    filters.append(f"[{i}:a]adelay={delay_ms}|{delay_ms},volume=1.0[a{i}]")

n = len(rt['captions'])
mix = ''.join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0:dropout_transition=0[aout]"
filters.append(mix)

out = root / 'public/assets/sentence-structure/audio-full.mp3'
cmd = ['ffmpeg', '-y'] + inputs + ['-filter_complex', ';'.join(filters),
       '-map', '[aout]', '-c:a', 'libmp3lame', '-b:a', '192k', str(out)]
print('Building single audio...', flush=True)
subprocess.run(cmd, check=True, capture_output=True)
print(f'Done: {out} ({out.stat().st_size/1e6:.1f}MB)', flush=True)

# Verify duration matches timeline
dur = float(subprocess.check_output(
    ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
     '-of', 'default=nw=1:nk=1', str(out)]))
print(f'audio-full duration: {dur:.2f}s vs timeline {rt["duration"]:.2f}s')
