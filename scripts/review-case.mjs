import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {ROOT,getCase,reviewFrames,sourceSignature} from './lib/factory.mjs';
process.chdir(ROOT);
const entry=getCase(process.argv[2]||'MathExplainer'),dir=`out/${entry.id}/review`;mkdirSync(dir,{recursive:true});
const flag=process.argv.indexOf('--frames'),frames=flag>=0?process.argv[flag+1].split(',').map(Number):reviewFrames(entry);
if(frames.some(f=>!Number.isInteger(f)||f<0))throw Error('帧号必须为非负整数');
const signature=sourceSignature(entry);
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE});
const reports=[];
try{
 const inputProps={debugAudit:true,showSafeArea:false};
 const composition=await selectComposition({serveUrl,id:entry.id,inputProps,puppeteerInstance:browser});
 for(const frame of frames){
  const logs=[],filename=`frame-${String(frame).padStart(5,'0')}.png`;
  await renderStill({serveUrl,composition,inputProps,frame,output:`${dir}/${filename}`,puppeteerInstance:browser,logLevel:'error',onBrowserLog:log=>{const m=log.text.match(/(?:MAP|FACTORY)_AUDIT (\{.*\})/);if(m)try{logs.push(JSON.parse(m[1]));}catch{}}});
  const audit=logs.find(r=>r.frame===frame);
  if(audit){
   if(audit.titleCount!==1||audit.labels.some(l=>!l.withinSafe||l.screenFont<29.9)||audit.caption&&audit.caption[3]>1500.1)throw Error(`安全区或字号检查失败: ${entry.id} / frame ${frame}`);
  }
  reports.push({frame,image:filename,audit:audit||null,requiresVisualReview:true});
 }
 if(entry.cover){const cover=await selectComposition({serveUrl,id:entry.cover,puppeteerInstance:browser});await renderStill({serveUrl,composition:cover,output:`${dir}/cover.png`,puppeteerInstance:browser,logLevel:'error'});}
}catch(error){throw error;}finally{await browser.close({silent:true});}
if(sourceSignature(entry)!==signature)throw Error('预览期间源文件变化，请重新导出实际帧。');
writeFileSync(`${dir}/safe-area-report.json`,JSON.stringify({id:entry.id,sourceSignature:signature,frames:reports,automaticChecks:reports.some(r=>r.audit)?'instrumented':'not-instrumented',note:'自动坐标检查不能代替逐帧查看图形、事实、遮挡与节奏。'},null,2)+'\n');
writeFileSync(`${dir}/index.html`,`<!doctype html><meta charset="utf-8"><title>${entry.id} review</title><style>body{font-family:sans-serif;background:#eee}img{width:270px}figure{display:inline-block}</style><h1>${entry.id}</h1>${reports.map(r=>`<figure><img src="${r.image}"><figcaption>frame ${r.frame}</figcaption></figure>`).join('')}${entry.cover?'<figure><img src="cover.png"><figcaption>cover</figcaption></figure>':''}`);
console.log(`已导出${reports.length}帧：${dir}/index.html；请查看实际画面。`);
