import {cpSync,existsSync,mkdirSync,readFileSync,renameSync,symlinkSync,realpathSync,readdirSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {ROOT} from './lib/factory.mjs';
const source=path.join(ROOT,'skills/short-video-factory');
const project=process.argv.includes('--project');
if(project){
 const parent=path.join(ROOT,'.agents/skills'),destination=path.join(parent,'short-video-factory');mkdirSync(parent,{recursive:true});
 if(existsSync(destination)&&realpathSync(destination)!==source)throw Error('项目中已有不同Skill，保留现有文件');
 if(!existsSync(destination))symlinkSync('../../skills/short-video-factory',destination,'dir');
 console.log('项目Skill入口:',destination);
}else{
 const parent=path.join(os.homedir(),'.agents/skills'),destination=path.join(parent,'short-video-factory');mkdirSync(parent,{recursive:true});
 const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]);
 if(existsSync(destination)){
  const same=files(source).every(f=>{const to=path.join(destination,path.relative(source,f));return existsSync(to)&&readFileSync(f).equals(readFileSync(to));})&&files(source).length===files(destination).length;
  if(same){console.log('全局Skill已是最新版:',destination);process.exit(0);}
  const backup=path.join(os.homedir(),'.agents/skill-backups',`short-video-factory-${Date.now()}`);mkdirSync(path.dirname(backup),{recursive:true});renameSync(destination,backup);console.log('已备份旧Skill:',backup);
 }
 cpSync(source,destination,{recursive:true});console.log('全局Skill已安装:',destination);
}
