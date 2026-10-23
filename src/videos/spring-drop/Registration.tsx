import {Composition,Still} from 'remotion';
import {W,H,FPS} from '../../shared/profile';
import {SpringDropVideo,SpringDropCover} from './Episode';
import content from './content.json';
import runtime from './runtime.json';
export const Registration=()=> <>
 <Composition id={content.id} component={SpringDropVideo} durationInFrames={runtime.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{debugAudit:false,showSafeArea:false}}/>
 <Still id={content.id+'Cover'} component={SpringDropCover} width={W} height={H}/>
</>;
