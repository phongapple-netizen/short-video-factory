const fs=require('fs');
const path=require('path');
const {bundle}=require('@remotion/bundler');
const {openBrowser,selectComposition,renderStill}=require('@remotion/renderer');
(async()=>{
 const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
 const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
 const inputProps={debugAudit:true};
 const composition=await selectComposition({serveUrl,id:'ChibiMapFull',inputProps,puppeteerInstance:browser});
 const runtime=JSON.parse(fs.readFileSync('src/videos/trapezoid/history/chibi.runtime.json','utf8'));
 const frames=[0,12,22,32,43,52,61,72,76].map(s=>[`${s}s`,s*30]);
 for(const scene of runtime.scenes.slice(1)){const frame=Math.round(scene.start*30);frames.push([`${scene.id}-before`,frame-1],[`${scene.id}-start`,frame],[`${scene.id}-after`,frame+9]);}
 fs.mkdirSync('out/chibi-map-full-check',{recursive:true});
 const reports=[];
 for(const [name,frame] of frames){
  const logs=[];
  await renderStill({serveUrl,composition,inputProps,frame,output:path.resolve('out/chibi-map-full-check/'+name+'.png'),puppeteerInstance:browser,logLevel:'error',
   onBrowserLog:(log)=>{if(log.text.includes('MAP_AUDIT ')){const json=log.text.split('MAP_AUDIT ')[1];try{logs.push(JSON.parse(json));}catch{console.log('Unparsed browser audit:',log.text);}}}
  });
  const row=logs.find(r=>r.frame===frame);
  if(!row)throw new Error('No DOM audit for '+name);
  reports.push({name,...row});
  if(row.titleCount!==1||row.titleBounds[0]<60||row.titleBounds[2]>930||row.titleBounds[3]>540||row.labels.some(l=>!l.withinSafe||l.screenFont<32)||row.caption&&row.caption[3]>1500)throw new Error('Geometry check failed: '+JSON.stringify(row));
  console.log(name,'passed;',row.labels.length,'labels; min font',Math.min(...row.labels.map(x=>x.screenFont)));
 }
 fs.writeFileSync('out/chibi-map-full-check/geometry-audit.json',JSON.stringify(reports,null,2)+'\n');
 await browser.close({silent:true});
})().catch(e=>{console.error(e);process.exit(1);});
