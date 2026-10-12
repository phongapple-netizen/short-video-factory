"""Generate Xiaoxiao speech with credentials supplied only via environment."""
import json
import os
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

import requests

root = Path(__file__).resolve().parents[2]
rows = json.loads((root / 'src/videos/trapezoid/narration.json').read_text())
timeline = json.loads((root / 'src/videos/trapezoid/timeline.json').read_text())
key = os.environ['AZURE_SPEECH_KEY']
region = os.environ['AZURE_SPEECH_REGION']
voice = os.environ.get('AZURE_SPEECH_VOICE', 'zh-CN-XiaoxiaoNeural')
audio = root / 'public/assets/trapezoid/audio-azure'
audio.mkdir(parents=True, exist_ok=True)


def duration(path):
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(path)
    ], text=True))


for row in rows:
    source = audio / f"{row['id']}.source.wav"
    fingerprint = audio / f"{row['id']}.text.txt"
    identity = voice + '\n' + row['voiceText']
    if source.exists() and fingerprint.exists() and fingerprint.read_text() == identity:
        continue
    ssml = (f'<speak version="1.0" xml:lang="zh-CN">'
            f'<voice name="{escape(voice)}">{escape(row["voiceText"])}</voice></speak>')
    response = requests.post(
        f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
        headers={'Ocp-Apim-Subscription-Key': key,
                 'Content-Type': 'application/ssml+xml',
                 'X-Microsoft-OutputFormat': 'riff-48khz-16bit-mono-pcm',
                 'User-Agent': 'TrapezoidExplainer'},
        data=ssml.encode('utf-8'), timeout=(15, 45))
    if response.status_code != 200:
        raise RuntimeError(f'Azure synthesis failed: HTTP {response.status_code}; cue {row["id"]}')
    if not response.content.startswith(b'RIFF'):
        raise RuntimeError('Azure response was not WAV audio')
    temporary = source.with_suffix('.temporary.wav')
    temporary.write_bytes(response.content)
    duration(temporary)
    temporary.replace(source)
    fingerprint.write_text(identity)
    print(f'Synthesized {row["id"]}: {voice}', flush=True)

cues = []
for scene, window in timeline.items():
    group = [row for row in rows if row['scene'] == scene]
    budget = window['end'] - window['start']
    raw_total = sum(duration(audio / f"{row['id']}.source.wav") for row in group)
    speed = max(1.0, raw_total / (budget - .4))
    if speed > 2.5:
        raise RuntimeError(f'{scene}: speech needs more than 2.5x speed')
    measured = []
    for row in group:
        wave = audio / f"{row['id']}.wav"
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-i', str(audio / f"{row['id']}.source.wav"),
            '-af', f'atempo={speed}', '-ar', '48000', '-ac', '1',
            '-c:a', 'pcm_s16le', str(wave)
        ], check=True)
        measured.append((row, duration(wave)))
    total = sum(d for _, d in measured)
    gap = (budget - total) / (len(group) + 1)
    assert gap >= 0
    cursor = window['start'] + gap
    for row, d in measured:
        cues.append({**row, 'audio': f'assets/trapezoid/audio-azure/{row["id"]}.wav',
                     'duration': round(d, 6), 'start': round(cursor, 6),
                     'end': round(cursor + d, 6), 'playbackRate': round(speed, 4),
                     'provider': 'Azure Speech', 'voice': voice})
        cursor += d + gap
    print(f'{scene}: {total:.2f}s / {budget}s, rate {speed:.3f}', flush=True)
(root / 'src/videos/trapezoid/captions.json').write_text(json.dumps(cues, ensure_ascii=False, indent=2) + '\n')
print(f'{len(cues)} Xiaoxiao cues aligned to 62 seconds.')
