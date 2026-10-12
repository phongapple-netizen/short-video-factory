import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const readJSON=file=>JSON.parse(readFileSync(path.resolve(ROOT,file),'utf8'));
export const profile=readJSON('standards/douyin-profile.json');
export const ID_PATTERN=/^[A-Za-z][A-Za-z0-9_-]*$/;
export function repositoryPath(file){
 if(typeof file!=='string'||path.isAbsolute(file))throw Error(`需要仓库相对路径: ${file}`);
 const target=path.resolve(ROOT,file);
 if(!target.startsWith(ROOT+path.sep))throw Error(`路径越过仓库: ${file}`);
 return target;
}
export const loadCases=()=>readJSON('cases.json');
export function allCompositions(){return loadCases().flatMap(c=>[{...c,current:true},...(c.versions||[]).map(v=>({...v,key:c.key,subject:c.subject,template:c.template,assets:v.assets||c.assets,sourceRoot:v.sourceRoot||c.sourceRoot,current:false}))]);}
export function getCase(selector){
 const result=loadCases().find(c=>c.key===selector)||allCompositions().find(c=>c.id===selector);
 if(!result)throw Error(`未登记案例: ${selector}；请用 npm run cases 查看`);
 return result;
}
export function sceneWindows(entry){
 if(!entry.timeline)return [{id:'video',start:0,end:entry.seconds}];
 const t=entry.timeline,data=readJSON(t.file);
 let rows=t.format==='windows'?Object.entries(data).map(([id,v])=>({id,...v})):data.scenes;
 if(t.scenes)rows=rows.filter(s=>t.scenes.includes(s.id));
 const offset=t.rebase?rows[0]?.start||0:0;
 return rows.map(s=>({...s,start:s.start-offset,end:s.end-offset}));
}
export const expectedSeconds=entry=>sceneWindows(entry).at(-1).end;
export function readCaptions(entry){
 if(!entry.captions)return [];
 const config=entry.captions,data=readJSON(config.file);
 let rows=Array.isArray(data)?data:data.captions;
 if(!Array.isArray(rows))throw Error(`字幕格式错误: ${config.file}`);
 if(config.scenes)rows=rows.filter(c=>config.scenes.includes(c.scene));
 const offset=config.rebase?sceneWindows({...entry,timeline:{...entry.timeline,rebase:false}})[0].start:0;
 return rows.map(c=>({...c,start:c.start-offset,end:c.end-offset}));
}
export function audioReady(entry){
 const cues=readCaptions(entry);
 if(!entry.narrated)return false;
 if(entry.content){
  const content=readJSON(entry.content),runtime=readJSON(entry.captions.file),voice=content.voice||{};
  const source={voice:voice.voice||(content.subject==='history'?profile.speech.history_voice:profile.speech.math_voice),rate:voice.rate||profile.speech.rate,scenes:content.scenes.map(s=>({id:s.id,plannedSeconds:s.plannedSeconds,cues:s.cues.map(c=>({id:c.id,text:c.text,voiceText:c.voiceText}))}))};
  if(runtime.timingMode!=='measured'||JSON.stringify(source)!==JSON.stringify(runtime.narrationSource))return false;
 }
 const data=entry.captions?readJSON(entry.captions.file):null;
 const grouped=data?.scenes?.filter(s=>s.audio&&(!entry.captions.scenes||entry.captions.scenes.includes(s.id)));
 const clips=grouped?.length?grouped:cues.filter(c=>c.audio);
 return clips.length>0&&clips.every(c=>existsSync(repositoryPath(`public/${c.audio}`)));
}
export function srt(cues){
 const stamp=s=>{const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`};
 return cues.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}
export function reviewFrames(entry){
 const fps=profile.video.fps,last=Math.round(expectedSeconds(entry)*fps)-1;
 const frames=[0,last];
 for(const s of sceneWindows(entry))frames.push(Math.round(s.start*fps),Math.round((s.start+s.end)*fps/2),Math.min(last,Math.round(s.end*fps)-1));
 return [...new Set(frames)].sort((a,b)=>a-b);
}
export function validateRegistry(){
 const seen=new Set(),keys=new Set();
 for(const c of loadCases()){
  if(keys.has(c.key))throw Error(`案例key重复: ${c.key}`);keys.add(c.key);
  if(c.stage==='published'&&(!c.preview||!existsSync(repositoryPath(c.preview))))throw Error(`正式案例缺成片: ${c.id}`);
 }
 for(const c of allCompositions()){
  if(!ID_PATTERN.test(c.id)||seen.has(c.id))throw Error(`Composition ID非法或重复: ${c.id}`);seen.add(c.id);
  if(!['published','draft','preview','archived','example'].includes(c.stage))throw Error(`版本状态非法: ${c.id}`);
  if(c.registration&&!existsSync(repositoryPath(c.registration)))throw Error(`缺少注册入口: ${c.registration}`);
  const windows=sceneWindows(c);if(!windows.length||windows.some(s=>!(s.end>s.start)))throw Error(`时间轴错误: ${c.id}`);
  if(Math.abs(expectedSeconds(c)-c.seconds)>1/profile.video.fps+.001)throw Error(`登记时长不同于时间轴: ${c.id}`);
  for(const q of readCaptions(c))if(!(q.end>q.start&&q.start>=0&&q.end<=expectedSeconds(c)+.05))throw Error(`字幕时间越界: ${c.id}/${q.id||q.text}`);
  if(c.narrated&&['published','archived','preview'].includes(c.stage)&&!audioReady(c))throw Error(`案例缺配音: ${c.id}`);
 }
 return seen.size;
}

export function sourceSignature(entry){
 const files=new Set(['standards/douyin-profile.json',entry.content,entry.captions?.file,entry.timeline?.file].filter(Boolean));
 const collect=(relative,media=false)=>{const absolute=repositoryPath(relative);if(statSync(absolute).isDirectory()){for(const f of readdirSync(absolute))collect(relative+'/'+f,media);}else if(media||/\.(tsx?|json)$/.test(relative))files.add(relative);};
 collect('src/shared');if(entry.assets)collect('public/'+entry.assets,true);if(entry.registration)collect(path.dirname(entry.registration));else if(entry.sourceRoot)collect(entry.sourceRoot);
 const data=entry.captions?readJSON(entry.captions.file):null;
 const clips=[...readCaptions(entry),...(data?.scenes||[])];for(const c of clips)if(c.audio)files.add('public/'+c.audio);
 const digest=createHash('sha256');for(const f of [...files].sort()){digest.update(f);digest.update(readFileSync(repositoryPath(f)));}
 return digest.digest('hex');
}
