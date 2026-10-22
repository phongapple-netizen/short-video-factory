import {readFileSync,existsSync} from 'node:fs';
import {profile,validateRegistry,allCompositions,readJSON,repositoryPath,ID_PATTERN} from './lib/factory.mjs';
const count=validateRegistry(),s=profile.safe_area;
if(!(0<=s.left&&s.left<s.right&&s.right<=profile.video.width&&0<=s.top&&s.top<s.bottom&&s.bottom<=profile.video.height))throw Error('安全区超出画布');
if(profile.layout.subtitle_bottom!==s.bottom||profile.typography.minimum_visible_px<30||profile.typography.opening_title_px<88)throw Error('字幕位置或字号不符合规范');
for(const c of allCompositions()){
 if(c.content){const d=readJSON(c.content);if(d.id!==c.id||!d.scenes.length)throw Error(`内容ID错误: ${c.id}`);const ids=new Set();for(const scene of d.scenes){if(!scene.id||!scene.title||scene.plannedSeconds<=0||!scene.cues.length)throw Error(`场景不完整: ${c.id}`);for(const q of scene.cues){if(ids.has(q.id)||!ID_PATTERN.test(q.id))throw Error(`字幕ID重复或非法: ${c.id}/${q.id}`);ids.add(q.id);if(!q.id||!q.text||!q.voiceText||q.text.split('\n').length>2||q.text.length>52)throw Error(`字幕为空或过长: ${c.id}/${q.id}`);}}}
 if(c.content){const d=readJSON(c.content),first=d.scenes[0];
  if(d.hook){const runtime=readJSON(c.captions.file),cue=runtime.captions?.find(q=>q.id===d.hook.cue),limit=d.hook.maxSeconds??4.5;
   if(first.cues[0].id!==d.hook.cue||!first.title?.trim())throw Error(`开场钩子必须是第一镜第一句且首帧有标题: ${c.id}`);
   if(runtime.timingMode==='measured'&&!(cue&&cue.end<=limit))throw Error(`开场钩子句超过${limit}秒: ${c.id}`);}
  if(!d.sources?.length||!d.learningGoal)console.warn(`提示: ${c.id} 缺少 sources 或 learningGoal`);}
 for(const dep of c.dependencies||[])if(!existsSync(repositoryPath(dep)))throw Error(`依赖文件不存在: ${c.id}/${dep}`);
 const [,longest]=profile.editorial_defaults.target_duration_seconds;
 if(c.current&&c.stage!=='example'&&c.seconds>longest*1.2)console.warn(`提示: ${c.id} 时长${Math.round(c.seconds)}秒，超过目标上限${longest}秒的1.2倍；考虑拆成系列`);
 for(const file of [c.captions?.file,c.content].filter(Boolean)){
  const d=readJSON(file);
  function walk(v){if(typeof v==='string'&&v.startsWith('assets/')&&!existsSync(repositoryPath('public/'+v)))throw Error(`素材不存在: ${v}`);if(v&&typeof v==='object')Object.values(v).forEach(walk);}
  walk(d);
 }
}
const skill=readFileSync(repositoryPath('skills/short-video-factory/SKILL.md'),'utf8');
if(!skill.startsWith('---\n')||!skill.includes('name: short-video-factory')||!skill.includes('description:'))throw Error('Skill frontmatter不完整');
console.log(`工作流检查通过：${count}个Composition，统一配置、时间轴、字幕、素材与Skill有效。`);
