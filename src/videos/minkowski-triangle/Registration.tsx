import {Composition,Still} from 'remotion';
import {W,H,FPS} from '../../shared/profile';
import {MinkowskiVideo,MinkowskiCover} from './Episode';
import content from './content.json';
import runtime from './runtime.json';
export const Registration=()=> <>
 <Composition id={content.id} component={MinkowskiVideo} durationInFrames={runtime.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{debugAudit:false,showSafeArea:false}}/>
 <Still id={content.id+'Cover'} component={MinkowskiCover} width={W} height={H}/>
</>;
