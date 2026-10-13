import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(path.join(root,p),'utf8'));
const content=read('src/videos/pirate-gold/content.json'),runtime=read('src/videos/pirate-gold/runtime.json');
const lines=read('src/videos/pirate-gold/sentences.json'),cases=read('cases.json');
const scenes=Object.fromEntries(runtime.scenes.map(s=>[s.id,s]));
assert.equal(runtime.scenes.length,13);
assert.equal(runtime.captions.length,content.scenes.reduce((n,s)=>n+s.cues.length,0));
assert.equal(runtime.durationInFrames,Math.round(runtime.duration*30));
assert(Math.abs(cases.find(c=>c.id==='PirateGold').seconds-runtime.duration)<1e-6);
for(let i=0;i<runtime.scenes.length;i++){
 const s=runtime.scenes[i];assert(Math.abs((s.end-s.start)*30-s.durationInFrames)<0.01,s.id);
 if(i)assert(Math.abs(s.start-runtime.scenes[i-1].end)<0.001,s.id);
}
const at=(id,phrase)=>{
 const s=scenes[id],line=lines.find(x=>x.start>=s.start&&x.start<s.end&&x.text.includes(phrase));
 assert(line,`missing cue: ${id}/${phrase}`);return line.start-s.start;
};
for(const [id,price,plan,vote] of [['08','E呢？','方案：','两票，通过。'],['09','收买价','方案：','两票，通过。'],['10','D是一枚','方案：','三票，通过。']]){
 assert(at(id,price)<at(id,plan),id+' price before plan');
 assert(at(id,plan)<at(id,vote),id+' plan before vote');
 assert(at(id,vote)+0.7<scenes[id].end-scenes[id].start,id+' vote fits');
}
for(const [ask,answer] of [['有人会问：C和E','因为拒绝的话'],['B和D为什么不反对','他们反对也没用'],['还有人问：A为什么','不需要。']])assert(at('11',ask)<at('11',answer));
const source={voice:content.voice.voice,rate:content.voice.rate,scenes:content.scenes.map(s=>({id:s.id,plannedSeconds:s.plannedSeconds,cues:s.cues.map(c=>({id:c.id,text:c.text,voiceText:c.voiceText}))}))};
assert.deepEqual(runtime.narrationSource,source);
console.log('PirateGold narration source, scene timings and event anchors OK');
