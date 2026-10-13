"""Synthesize PirateGold narration via Azure TTS, build measured runtime."""
import hashlib, json, math, os, subprocess
from pathlib import Path
from xml.sax.saxutils import escape

root = Path('/home/hatch/workspace/short-video-factory')
content = json.loads((root / 'src/videos/pirate-gold/content.json').read_text())
voice = 'zh-CN-XiaoxiaoNeural'
rate = '-5%'
region = os.environ['AZURE_SPEECH_REGION']
key = os.environ['AZURE_SPEECH_KEY']
fps = 30

audio_dir = root / 'public/assets/pirate-gold/audio'
audio_dir.mkdir(parents=True, exist_ok=True)

cache = []
for scene in content['scenes']:
    for cue in scene['cues']:
        identity = json.dumps({'voice': voice, 'rate': rate, 'text': cue['voiceText']},
                              ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
        digest = hashlib.sha256(identity).hexdigest()[:16]
        target = audio_dir / f"{cue['id']}-{digest}.mp3"
        if not target.exists():
            ssml = (f'<speak version="1.0" xml:lang="zh-CN"><voice name="{escape(voice)}">'
                    f'<prosody rate="{escape(rate)}">{escape(cue["voiceText"])}</prosody></voice></speak>')
            import requests
            r = requests.post(
                f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
                headers={'Ocp-Apim-Subscription-Key': key,
                         'Content-Type': 'application/ssml+xml',
                         'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3'},
                data=ssml.encode(), timeout=(15, 45))
            if r.status_code != 200:
                raise SystemExit(f'Azure 合成失败 {cue["id"]}: HTTP {r.status_code}')
            target.write_bytes(r.content)
            print(f'synthesized {cue["id"]}', flush=True)
        else:
            print(f'cached {cue["id"]}', flush=True)
        duration = float(subprocess.check_output(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=nw=1:nk=1', str(target)]))
        cache.append((scene, cue, target, duration))

# Build measured timeline
lead_in, tail, gap = 0.6, 0.8, 0.35
scenes, captions = [], []
cursor = 0.0
for scene in content['scenes']:
    clips = [c for c in cache if c[0]['id'] == scene['id']]
    voice_seconds = sum(c[3] for c in clips) + gap * max(0, len(clips) - 1)
    duration = math.ceil(max(scene['plannedSeconds'], lead_in + voice_seconds + tail) * fps) / fps
    start = cursor
    cursor += duration
    at = start + lead_in
    scenes.append({'id': scene['id'], 'start': start, 'end': cursor,
                   'durationInFrames': round(duration * fps)})
    for _, cue, path, length in clips:
        captions.append({'id': cue['id'], 'scene': scene['id'], 'text': cue['text'],
                         'start': at, 'end': at + length, 'duration': length,
                         'audio': path.relative_to(root / 'public').as_posix()})
        at += length + gap
    print(f'{scene["id"]}: {start:.2f}-{cursor:.2f}s | voice {voice_seconds:.2f}s')

runtime = {'timingMode': 'measured', 'duration': cursor, 'durationInFrames': round(cursor * fps),
           'voice': voice, 'rate': rate, 'scenes': scenes, 'captions': captions}
(root / 'src/videos/pirate-gold/runtime.json').write_text(
    json.dumps(runtime, ensure_ascii=False, indent=2) + '\n')
print(f'TOTAL {cursor:.2f}s')
