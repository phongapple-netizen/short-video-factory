"""Generate scene narration, measured timeline and SRT from one editorial JSON."""
import asyncio
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

import edge_tts
import requests

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'src/videos/trapezoid/history/chibi.json'
data = json.loads(SOURCE.read_text())
audio = ROOT / 'public/assets/chibi/audio'
audio.mkdir(parents=True, exist_ok=True)
settings = data['audio']
voice = settings['voice']
rate = settings['rate']
proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
        'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(path)], text=True))


async def edge_available():
    try:
        await asyncio.wait_for(edge_tts.Communicate('配音测试。', voice, rate=rate,
            proxy=proxy).save(str(audio / 'test.mp3')), timeout=15)
        return True
    except Exception as e:
        print(f'WARNING: edge-tts unavailable ({type(e).__name__}); trying configured Azure fallback.', flush=True)
        return False


use_edge = settings['provider'] == 'edge-tts' and asyncio.run(edge_available())
provider = 'edge-tts' if use_edge else 'Azure Speech'
if not use_edge:
    if settings.get('fallback') != 'azure' or not os.environ.get('AZURE_SPEECH_KEY'):
        raise RuntimeError('Edge unavailable and Azure fallback credentials are missing')
    region = os.environ['AZURE_SPEECH_REGION']

for scene in data['scenes']:
    path = audio / f"{scene['id']}.mp3"
    cache = audio / f"{scene['id']}.cache.json"
    identity = hashlib.sha256((provider+voice+rate+scene['voiceText']).encode()).hexdigest()
    if path.exists() and cache.exists() and json.loads(cache.read_text())['hash'] == identity:
        continue
    temp = audio / f"{scene['id']}.temporary.mp3"
    if use_edge:
        asyncio.run(edge_tts.Communicate(scene['voiceText'], voice, rate=rate,
            proxy=proxy).save(str(temp)))
    else:
        ssml = (f'<speak version="1.0" xml:lang="zh-CN"><voice name="{escape(voice)}">'
                f'<prosody rate="{escape(rate)}">{escape(scene["voiceText"])}</prosody>'
                '</voice></speak>')
        response = requests.post(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
            headers={'Ocp-Apim-Subscription-Key': os.environ['AZURE_SPEECH_KEY'],
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
                'User-Agent': 'HistoryExplainer'}, data=ssml.encode(), timeout=(15,45))
        if response.status_code != 200:
            raise RuntimeError(f'Azure synthesis HTTP {response.status_code}, scene {scene["id"]}')
        temp.write_bytes(response.content)
    duration(temp)
    temp.replace(path)
    cache.write_text(json.dumps({'hash':identity,'provider':provider,'voice':voice,'rate':rate})+'\n')
    print(f'Generated scene {scene["id"]} ({provider}, {voice}, {rate})', flush=True)

cursor = 0
timeline = []
captions = []
for scene in data['scenes']:
    length = duration(audio / f"{scene['id']}.mp3")
    # Round the measured duration UP to whole video frames so the tail remains >=0.5s.
    import math
    frames = math.ceil(max(scene['planned'], length+settings['leadIn']+settings['tail'])*30)
    seconds = frames/30
    count = len(re.findall(r'[\u4e00-\u9fff]', scene['voiceText']))
    cps = count/length
    row = {'id':scene['id'],'start':cursor,'end':cursor+seconds,
        'duration':seconds,'durationInFrames':frames,'audioDuration':length,
        'audioStart':cursor+settings['leadIn'],'audioEnd':cursor+settings['leadIn']+length,
        'audio':f"assets/chibi/audio/{scene['id']}.mp3",'characters':count,'charactersPerSecond':round(cps,2)}
    timeline.append(row)
    parts = scene['captions']
    weights = [len(re.sub(r'[^\w\u4e00-\u9fff]', '', p)) for p in parts]
    at = row['audioStart']
    for text, weight in zip(parts,weights):
        end = at+length*weight/sum(weights)
        captions.append({'scene':scene['id'],'start':at,'end':end,'text':text})
        at = end
    cursor += seconds
    warn = ' WARNING >4.8 chars/s' if cps>4.8 else ''
    print(f"{scene['id']} {row['start']:6.2f}–{row['end']:6.2f}s | voice {length:5.2f}s | {cps:4.2f} chars/s{warn}",flush=True)

assets = {scene['image']:bool((ROOT/'public'/scene['image']).exists())
          for scene in data['scenes'] if scene.get('image')}
for path, exists in assets.items():
    if not exists:print(f'WARNING: missing image {path}; gradient placeholder will be used.')
bgm = bool((ROOT/'public'/settings['bgm']).exists())
runtime = {'source':SOURCE.name,'provider':provider,'voice':voice,'rate':rate,
    'duration':cursor,'durationInFrames':sum(r['durationInFrames'] for r in timeline),
    'scenes':timeline,'captions':captions,'assets':assets,'bgmExists':bgm}
(ROOT/'src/videos/trapezoid/history/chibi.runtime.json').write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n')
out = ROOT/'out/chibi'
out.mkdir(parents=True,exist_ok=True)
(out/'scene-table.json').write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n')

def stamp(sec):
    ms = round(sec*1000)
    return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'

(out/'captions.srt').write_text('\n\n'.join(
    f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}'
    for i,c in enumerate(captions))+'\n',encoding='utf-8')
print(f'Total measured composition duration: {cursor:.2f}s. BGM: {bgm}.',flush=True)
