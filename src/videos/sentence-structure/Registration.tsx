import {Audio,Composition,Still,staticFile} from 'remotion';
import {StoryVideo,StoryCover,type StoryContent,type StoryRuntime} from '../../shared/story';
import {W,H,FPS} from '../../shared/profile';
import content from './content.json';
import runtime from './runtime.json';
import {Diagram} from './Diagram';
// 全片单轨配音（时间轴已对齐，避免多 Audio 组件的音量衰减问题）
const GlobalAudio=()=><Audio src={staticFile('assets/sentence-structure/audio-full.mp3')}/>;
const Video=(props:{debugAudit?:boolean;showSafeArea?:boolean})=><><StoryVideo content={content as StoryContent} runtime={runtime as StoryRuntime} Diagram={Diagram} {...props}/><GlobalAudio/></>;;
const Cover=()=><StoryCover content={content as StoryContent} Diagram={Diagram}/>;
export const Registration=()=> <>
 <Composition id={content.id} component={Video} durationInFrames={runtime.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{debugAudit:false,showSafeArea:false}}/>
 <Still id={content.id+'Cover'} component={Cover} width={W} height={H}/>
</>;
