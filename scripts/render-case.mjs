import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {ROOT,getCase,profile,readCaptions,readJSON,srt,expectedSeconds,audioReady,sourceSignature} from './lib/factory.mjs';
process.chdir(ROOT);
const selector=process.argv[2]||'MathExplainer';
if(selector==='PirateGold'||selector==='pirate-gold'){
 const a=spawnSync('python3',['scripts/prepare-voice.py','PirateGold','--cached-only'],{stdio:'inherit'});
 if(a.status!==0)process.exit(a.status??1);
}
const entry=getCase(selector),id=entry.id,quality=process.argv[3]||'final';
if(!['final','draft'].includes(quality))throw Error('quality 必须为 final 或 draft');
const ready=audioReady(entry);
if(entry.narrated&&!ready&&quality==='final')throw Error(`正式渲染需要与当前文案一致的真实配音时间轴；先执行 npm run voice:case -- ${id}`);
const dir=`out/${id}`;mkdirSync(dir,{recursive:true});
const run=(command,args)=>{const r=spawnSync(command,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);};
const browser=process.env.REMOTION_BROWSER_EXECUTABLE?[`--browser-executable=${process.env.REMOTION_BROWSER_EXECUTABLE}`]:[];
const concurrency=Number(process.env.REMOTION_CONCURRENCY||1);
if(!Number.isInteger(concurrency)||concurrency<1||concurrency>4)throw Error('REMOTION_CONCURRENCY 必须为1–4');
const signature=sourceSignature(entry);
const raw=`${dir}/${ready?'raw':id}.mp4`,e=profile.encoding;
run('npx',['remotion','render','src/index.ts',id,raw,`--codec=${e.video_codec}`,`--audio-codec=${profile.audio.codec}`,`--pixel-format=${e.pixel_format}`,`--color-space=${e.color_space}`,`--concurrency=${concurrency}`,'--overwrite',...(quality==='draft'?[`--scale=${profile.draft.scale}`,`--crf=${profile.draft.crf}`]:[`--crf=${e.crf}`]),...browser]);
if(sourceSignature(entry)!==signature)throw Error('渲染期间源文件变化，请重渲染，避免交付旧片。');
if(ready)run('python3',['scripts/normalize_audio.py',raw,`${dir}/${id}.mp4`]);
if(entry.cover)run('npx',['remotion','still','src/index.ts',entry.cover,`${dir}/cover.png`,'--overwrite',...browser]);
const cues=entry.sentenceCaptions?readJSON(entry.sentenceCaptions):readCaptions(entry);if(cues.length)writeFileSync(`${dir}/captions.srt`,srt(cues));
run('python3',['scripts/verify-video.py',`${dir}/${id}.mp4`,'--seconds',String(expectedSeconds(entry)),...(quality==='draft'?['--draft']:[]),...(!ready?['--silent']:[])]);
writeFileSync(`${dir}/delivery.json`,JSON.stringify({id,quality,sourceSignature:signature,version:entry.stage,durationSeconds:expectedSeconds(entry),narration:ready?'measured':entry.narrated?'planned-draft':'silent-example',video:`${id}.mp4`,cover:entry.cover?'cover.png':null,subtitles:cues.length?'captions.srt':null},null,2)+'\n');
console.log(`完成：${dir}/${id}.mp4`);
