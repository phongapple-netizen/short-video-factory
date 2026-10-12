import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,cpSync,mkdirSync,symlinkSync,readdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ROOT,getCase,readCaptions,expectedSeconds,validateRegistry,srt,profile,loadCases} from './lib/factory.mjs';
test('Stable case key selects full current history, with independent rebased preview timing',()=>{
 assert.equal(getCase('chibi-map').id,loadCases().find(c=>c.key==='chibi-map').id);
 assert.notEqual(getCase('chibi-map').id,'ChibiMapPreview');
 assert.throws(()=>getCase('UnknownUnregisteredId'));
 const preview=getCase('ChibiMapPreview');assert.equal(preview.stage,'preview');
 assert.ok(Math.abs(expectedSeconds(preview)-758/30)<1e-7);
 const cues=readCaptions(preview);assert.ok(cues.every(c=>['04','05'].includes(c.scene)));assert.ok(cues.every(c=>c.start>=0&&c.end<=758/30));
});
test('Existing cases and SRT retain measured times',()=>{
 assert.ok(validateRegistry()>=7);
 assert.equal(expectedSeconds(getCase('MathExplainer')),63);assert.equal(expectedSeconds(getCase('TrapezoidExplainer')),62);
 assert.match(srt([{text:'20+16+4+16+20=76',start:59.9996,end:61.25}]),/00:01:00,000 --> 00:01:01,250/);
 assert.equal(profile.video.width,1080);assert.equal(profile.safe_area.bottom,1500);
});
test('Scaffolding registers each subject; cached speech is measured and failures preserve runtime',()=>{
 mkdirSync(path.join(ROOT,'out'),{recursive:true});
 const directory=mkdtempSync(path.join(ROOT,'out','factory-test-'));
 const run=(cmd,args,expected=0)=>{const r=spawnSync(cmd,args,{cwd:directory,encoding:'utf8'});assert.equal(r.status,expected,`${cmd} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);return r;};
 try{
  for(const name of ['src','scripts','standards','templates','skills','.github'])cpSync(path.join(ROOT,name),path.join(directory,name),{recursive:true});
  for(const name of ['cases.json','README.md','package.json','tsconfig.json'])cpSync(path.join(ROOT,name),path.join(directory,name));
  symlinkSync(path.join(ROOT,'node_modules'),path.join(directory,'node_modules'),'dir');
  mkdirSync(path.join(directory,'previews'));for(const f of readdirSync(path.join(ROOT,'previews')))symlinkSync(path.join(ROOT,'previews',f),path.join(directory,'previews',f));
  mkdirSync(path.join(directory,'public/assets'),{recursive:true});for(const f of readdirSync(path.join(ROOT,'public/assets')))symlinkSync(path.join(ROOT,'public/assets',f),path.join(directory,'public/assets',f),'dir');
  for(const subject of ['math','history','physics','chemistry'])run(process.execPath,['scripts/new-video.mjs',`Fixture${subject}`,'--subject',subject]);
  run(process.execPath,['scripts/check-factory.mjs']);run('npm',['run','typecheck']);run(process.execPath,['scripts/sync-registry.mjs','--check']);
  const noVoice=spawnSync(process.execPath,['scripts/render-case.mjs','Fixturemath','final'],{cwd:directory,encoding:'utf8'});assert.notEqual(noVoice.status,0);assert.match(noVoice.stderr,/真实配音时间轴/);
  for(const id of ['Cover','CheckStill','FixturemathCover','CubeCrossHoles']){const conflict=spawnSync(process.execPath,['scripts/new-video.mjs',id],{cwd:directory,encoding:'utf8'});assert.notEqual(conflict.status,0);}
  const duplicate=spawnSync(process.execPath,['scripts/new-video.mjs','Fixturemath'],{cwd:directory,encoding:'utf8'});assert.notEqual(duplicate.status,0);
  if(process.env.FACTORY_RENDER_TEST==='1'){
   const saved=path.join(ROOT,'out','factory-template-review');mkdirSync(saved,{recursive:true});
   for(const subject of ['math','history','physics','chemistry']){
    run(process.execPath,['scripts/review-case.mjs',`Fixture${subject}`,'--frames','0,90']);
    cpSync(path.join(directory,`out/Fixture${subject}/review`),path.join(saved,subject),{recursive:true});
   }
  }
  const available=spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status===0;
  if(available){
   const contentFile=path.join(directory,'src/videos/fixturemath/content.json'),runtimeFile=path.join(directory,'src/videos/fixturemath/runtime.json');
   const d=JSON.parse(readFileSync(contentFile));d.scenes[0].plannedSeconds=.1;writeFileSync(contentFile,JSON.stringify(d));
   // Synthetic MP3 is only an isolated duration/cache fixture, never a narrated deliverable.
   for(const scene of d.scenes)for(const c of scene.cues){
    const identity=JSON.stringify({rate:d.voice.rate,text:c.voiceText,voice:d.voice.voice});
    const digest=createHash('sha256').update(identity).digest('hex').slice(0,16);
    const target=`public/assets/fixturemath/audio/${c.id}-${digest}.mp3`;
    run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','sine=frequency=440:duration=1','-c:a','libmp3lame',target]);
   }
   run('python3',['scripts/prepare-voice.py','Fixturemath','--cached-only']);
   const measured=JSON.parse(readFileSync(runtimeFile));assert.equal(measured.timingMode,'measured');assert.ok(measured.scenes[0].end>1.8);assert.equal(measured.scenes[1].end-measured.scenes[1].start,12);
   for(const c of measured.captions)assert.ok(c.end>c.start&&existsSync(path.join(directory,'public',c.audio)));
   const before=readFileSync(runtimeFile,'utf8');d.scenes[0].cues[0].voiceText+='缓存应失效。';writeFileSync(contentFile,JSON.stringify(d));
   const fail=spawnSync('python3',['scripts/prepare-voice.py','Fixturemath','--cached-only'],{cwd:directory,encoding:'utf8'});assert.notEqual(fail.status,0);assert.equal(readFileSync(runtimeFile,'utf8'),before);
   const stale=spawnSync(process.execPath,['scripts/render-case.mjs','Fixturemath','final'],{cwd:directory,encoding:'utf8'});assert.notEqual(stale.status,0);assert.match(stale.stderr,/真实配音时间轴/);
   if(process.env.FACTORY_RENDER_TEST==='1'){
    d.scenes[0].cues[0].voiceText=d.scenes[0].cues[0].voiceText.replace('缓存应失效。','');writeFileSync(contentFile,JSON.stringify(d));
    run(process.execPath,['scripts/review-case.mjs','Fixturemath','--frames','0,90']);
    run(process.execPath,['scripts/render-case.mjs','Fixturemath','final']);
    run(process.execPath,['scripts/deliver-case.mjs','Fixturemath','--reviewed']);
    const delivered=JSON.parse(readFileSync(path.join(directory,'cases.json'))).find(c=>c.id==='Fixturemath');assert.equal(delivered.stage,'published');
    for(const f of [delivered.preview,delivered.smallPreview,delivered.previewCover,delivered.subtitles])assert.ok(existsSync(path.join(directory,f)));
    const beforeFiles=readFileSync(path.join(directory,delivered.preview));
    d.model.height=12;writeFileSync(contentFile,JSON.stringify(d));
    const changed=spawnSync(process.execPath,['scripts/deliver-case.mjs','Fixturemath','--reviewed'],{cwd:directory,encoding:'utf8'});assert.notEqual(changed.status,0);assert.match(changed.stderr,/需重新预览/);
    assert.ok(readFileSync(path.join(directory,delivered.preview)).equals(beforeFiles));
   }
  }
 }finally{rmSync(directory,{recursive:true,force:true});}
});
