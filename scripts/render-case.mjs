import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const cases=JSON.parse(readFileSync('cases.json','utf8'));
const id=process.argv[2] || 'MathExplainer';
const quality=process.argv[3] || 'final';
const entry=cases.find(c=>c.id===id);
if (!entry && !['ChibiMapPreview','PirateCoins','FactoryDemo'].includes(id)) throw Error('请选择 cases.json 中的案例或已注册的示例');
if (!['final','draft'].includes(quality)) throw Error('quality 必须为 final 或 draft');
const dir=`out/${id}`;mkdirSync(dir,{recursive:true});
const run=(command,args)=>{const result=spawnSync(command,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1)};
const browser=process.env.REMOTION_BROWSER_EXECUTABLE ? [`--browser-executable=${process.env.REMOTION_BROWSER_EXECUTABLE}`] : [];
const narrated=Boolean(entry)||id==='ChibiMapPreview';
const raw=`${dir}/${narrated?'raw':id}.mp4`;
run('npx',['remotion','render','src/index.ts',id,raw,'--codec=h264','--audio-codec=aac','--pixel-format=yuv420p','--color-space=bt709','--concurrency=1','--overwrite',...(quality==='draft'?['--scale=0.5','--crf=22']:['--crf=16']),...browser]);
if(narrated)run('python3',['scripts/normalize_audio.py',raw,`${dir}/${id}.mp4`]);
if(entry?.cover)run('npx',['remotion','still','src/index.ts',entry.cover,`${dir}/cover.png`,'--overwrite',...browser]);
if(['MathExplainer','TrapezoidExplainer','ChibiHistory'].includes(id)){
 const folder=id==='MathExplainer'?'cube':'trapezoid';
 const cues=id==='ChibiHistory' ? JSON.parse(readFileSync('src/videos/trapezoid/history/chibi.runtime.json','utf8')).captions : JSON.parse(readFileSync(`src/videos/${folder}/captions.json`,'utf8'));
 const timestamp=s=>{const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`};
 writeFileSync(`${dir}/captions.srt`,cues.map((c,i)=>`${i+1}\n${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`).join('\n'));
}
console.log(`完成：${dir}/${id}.mp4`);
