"""Generate or reuse per-cue narration, then build a measured common timeline."""
import argparse,asyncio,hashlib,json,math,os,subprocess
from pathlib import Path
from xml.sax.saxutils import escape
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('case');p.add_argument('--cached-only',action='store_true');a=p.parse_args()
rows=json.loads((root/'cases.json').read_text());entry=next((c for c in rows if c['id']==a.case or c['key']==a.case),None)
if not entry or not entry.get('content'):raise SystemExit('此命令用于新模板；现有三个案例的配音脚本见 standards/WORKFLOW.md。')
content=json.loads((root/entry['content']).read_text());profile=json.loads((root/'standards/douyin-profile.json').read_text());settings={**profile['speech'],**content.get('voice',{})};fps=profile['video']['fps']
voice=settings.get('voice') or settings['history_voice' if content['subject']=='history' else 'math_voice'];rate=settings['rate'];directory=root/'public'/entry['assets']/'audio';directory.mkdir(parents=True,exist_ok=True)
cache=[]
for scene in content['scenes']:
 for cue in scene['cues']:
  identity=json.dumps({'voice':voice,'rate':rate,'text':cue['voiceText']},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
  digest=hashlib.sha256(identity).hexdigest()[:16];target=directory/f"{cue['id']}-{digest}.mp3"
  if not target.exists():
   if a.cached_only:raise SystemExit(f'缺少配音缓存: {cue["id"]}')
   temp=target.with_suffix('.pending.mp3');provider=settings['provider']
   try:
    if provider=='edge-tts':
     import edge_tts
     async def synth():await asyncio.wait_for(edge_tts.Communicate(cue['voiceText'],voice,rate=rate,proxy=os.environ.get('HTTPS_PROXY')).save(str(temp)),timeout=40)
     asyncio.run(synth())
    else:raise RuntimeError('Use Azure')
   except Exception:
    if settings.get('fallback')!='azure' or not os.environ.get('AZURE_SPEECH_KEY') or not os.environ.get('AZURE_SPEECH_REGION'):
     temp.unlink(missing_ok=True);raise SystemExit('配音服务不可用；保留已有缓存。可配置 Azure 环境变量后重试。')
    import requests
    ssml=f'<speak version="1.0" xml:lang="zh-CN"><voice name="{escape(voice)}"><prosody rate="{escape(rate)}">{escape(cue["voiceText"])}</prosody></voice></speak>'
    response=requests.post(f'https://{os.environ["AZURE_SPEECH_REGION"]}.tts.speech.microsoft.com/cognitiveservices/v1',headers={'Ocp-Apim-Subscription-Key':os.environ['AZURE_SPEECH_KEY'],'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-48khz-192kbitrate-mono-mp3'},data=ssml.encode(),timeout=(15,45))
    if response.status_code!=200:temp.unlink(missing_ok=True);raise SystemExit(f'Azure 合成失败: HTTP {response.status_code}；保留已有音频')
    temp.write_bytes(response.content);provider='Azure Speech'
   duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(temp)]));assert duration>0
   temp.replace(target);target.with_suffix('.cache.json').write_text(json.dumps({'identity':digest,'provider':provider,'voice':voice,'rate':rate},ensure_ascii=False)+'\n')
  duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)]));assert duration>0
  metadata=target.with_suffix('.cache.json');actual_provider=json.loads(metadata.read_text()).get('provider','cached') if metadata.exists() else 'cached'
  cache.append((scene,cue,target,duration,actual_provider))
# Existing audio and runtime remain usable if any earlier synthesis failed.
scenes=[];captions=[];cursor=0
for scene in content['scenes']:
 clips=[c for c in cache if c[0]['id']==scene['id']]
 voice_seconds=sum(c[3] for c in clips)+settings['cue_gap_seconds']*max(0,len(clips)-1)
 duration=math.ceil(max(scene['plannedSeconds'],settings['lead_in_seconds']+voice_seconds+settings['tail_seconds'])*fps)/fps
 start=cursor;cursor+=duration;at=start+settings['lead_in_seconds'];characters=sum(sum(ch.isalnum() for ch in c[1]['voiceText']) for c in clips);cps=characters/max(.001,sum(c[3] for c in clips))
 scenes.append({'id':scene['id'],'start':start,'end':cursor,'durationInFrames':round(duration*fps),'audioDuration':sum(c[3] for c in clips),'charactersPerSecond':round(cps,2)})
 for _,cue,path,length,actual_provider in clips:
  captions.append({**cue,'scene':scene['id'],'start':at,'end':at+length,'duration':length,'provider':actual_provider,'audio':str(path.relative_to(root/'public'))});at+=length+settings['cue_gap_seconds']
 print(f'{scene["id"]}: {start:.2f}–{cursor:.2f}s | 配音 {voice_seconds:.2f}s | {cps:.2f}字/秒'+(' WARNING: 超过4.8字/秒' if cps>settings['warn_characters_per_second'] else ''))
narration_source={'voice':voice,'rate':rate,'scenes':[{'id':s['id'],'plannedSeconds':s['plannedSeconds'],'cues':[{k:c[k] for k in ['id','text','voiceText']} for c in s['cues']]} for s in content['scenes']]}
runtime={'providers':sorted({c[4] for c in cache}),'narrationSource':narration_source,'timingMode':'measured','duration':cursor,'durationInFrames':round(cursor*fps),'voice':voice,'rate':rate,'scenes':scenes,'captions':captions}
(root/entry['captions']['file']).write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n');entry['seconds']=cursor;(root/'cases.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['node','scripts/sync-registry.mjs'],cwd=root,check=True)
