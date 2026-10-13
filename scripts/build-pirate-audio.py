"""Build single timeline-accurate audio file and sentence-level subtitles for PirateGold."""
import json, subprocess
from pathlib import Path

root = Path('/home/hatch/workspace/short-video-factory')
rt = json.loads((root / 'src/videos/pirate-gold/runtime.json').read_text())
content = json.loads((root / 'src/videos/pirate-gold/content.json').read_text())

# Map cue id -> voiceText
voicemap = {}
for s in content['scenes']:
    for c in s['cues']:
        voicemap[c['id']] = c['voiceText']

# Build ffmpeg concat with silences
# Timeline: each caption at its start time, audio file plays
# We'll use adelay + amix
inputs = []
filters = []
for i, cap in enumerate(rt['captions']):
    p = root / 'public' / cap['audio']
    inputs += ['-i', str(p)]
    delay_ms = int(cap['start'] * 1000)
    filters.append(f"[{i}:a]adelay={delay_ms}|{delay_ms},volume=1.0[a{i}]")

n = len(rt['captions'])
mix = ''.join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0:dropout_transition=0[aout]"
filters.append(mix)

out = root / 'public/assets/pirate-gold/audio-full.mp3'
cmd = ['ffmpeg', '-y'] + inputs + ['-filter_complex', ';'.join(filters),
       '-map', '[aout]', '-c:a', 'libmp3lame', '-b:a', '192k', str(out)]
print('Building single audio...', flush=True)
subprocess.run(cmd, check=True, capture_output=True)
print(f'Done: {out} ({out.stat().st_size/1e6:.1f}MB)', flush=True)

# Build sentence-level SRT from voiceText
import re
def split_sentences(text):
    # Split by Chinese punctuation, keep delimiter
    parts = re.split(r'([。！？；])', text)
    sents = []
    for i in range(0, len(parts)-1, 2):
        s = (parts[i] + parts[i+1]).strip()
        if s:
            sents.append(s)
    if len(parts) % 2 == 1 and parts[-1].strip():
        sents.append(parts[-1].strip())
    return sents

# For SRT, we need timing per sentence. Estimate by character proportion.
srt_entries = []
idx = 1
for cap in rt['captions']:
    vt = voicemap[cap['id']]
    sents = split_sentences(vt)
    if not sents:
        sents = [vt]
    total_chars = sum(len(s) for s in sents)
    t = cap['start']
    dur = cap['end'] - cap['start']
    for s in sents:
        sd = dur * len(s) / total_chars
        srt_entries.append((t, t+sd, s))
        t += sd
    # Adjust last to match cap end
    if srt_entries:
        s, e, txt = srt_entries[-1]
        srt_entries[-1] = (s, cap['end'], txt)

def fmt(s):
    h, m = int(s//3600), int(s%3600//60)
    ss, ms = int(s%60), int(s%1*1000)
    return f"{h:02d}:{m:02d}:{ss:02d},{ms:03d}"

srt = ''
for i, (s, e, txt) in enumerate(srt_entries, 1):
    srt += f"{i}\n{fmt(s)} --> {fmt(e)}\n{txt}\n\n"

(root / 'out/PirateGold/pirate-gold-sentences.srt').write_text(srt)
print(f'SRT: {len(srt_entries)} sentences', flush=True)

# Save sentence timings for the component
sent_data = [{'start': s, 'end': e, 'text': txt} for s, e, txt in srt_entries]
(root / 'src/videos/pirate-gold/sentences.json').write_text(
    json.dumps(sent_data, ensure_ascii=False, indent=1))
print('sentences.json written', flush=True)
