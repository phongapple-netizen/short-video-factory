import {readFileSync,existsSync} from 'node:fs';
import {profile,validateRegistry,allCompositions,readJSON,repositoryPath,ID_PATTERN} from './lib/factory.mjs';
const count=validateRegistry(),s=profile.safe_area;
if(!(0<=s.left&&s.left<s.right&&s.right<=profile.video.width&&0<=s.top&&s.top<s.bottom&&s.bottom<=profile.video.height))throw Error('安全区超出画布');
if(profile.layout.subtitle_bottom!==s.bottom||profile.typography.minimum_visible_px<30||profile.typography.opening_title_px<88)throw Error('字幕位置或字号不符合规范');
for(const c of allCompositions()){
 if(c.content){const d=readJSON(c.content);if(d.id!==c.id||!d.scenes.length)throw Error(`内容ID错误: ${c.id}`);const ids=new Set();for(const scene of d.scenes){if(!scene.id||!scene.title||scene.plannedSeconds<=0||!scene.cues.length)throw Error(`场景不完整: ${c.id}`);for(const q of scene.cues){if(ids.has(q.id)||!ID_PATTERN.test(q.id))throw Error(`字幕ID重复或非法: ${c.id}/${q.id}`);ids.add(q.id);if(!q.id||!q.text||!q.voiceText||q.text.split('\n').length>2||q.text.length>52)throw Error(`字幕为空或过长: ${c.id}/${q.id}`);}}}
 for(const file of [c.captions?.file,c.content].filter(Boolean)){
  const d=readJSON(file);
  function walk(v){if(typeof v==='string'&&v.startsWith('assets/')&&!existsSync(repositoryPath('public/'+v)))throw Error(`素材不存在: ${v}`);if(v&&typeof v==='object')Object.values(v).forEach(walk);}
  walk(d);
 }
}
const skill=readFileSync(repositoryPath('skills/short-video-factory/SKILL.md'),'utf8');
if(!skill.startsWith('---\n')||!skill.includes('name: short-video-factory')||!skill.includes('description:'))throw Error('Skill frontmatter不完整');
console.log(`工作流检查通过：${count}个Composition，统一配置、时间轴、字幕、素材与Skill有效。`);
