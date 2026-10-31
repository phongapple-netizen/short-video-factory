import {Composition,Still} from 'remotion';
import {W,H,FPS} from '../../shared/profile';
import {ChiralEp1Video,ChiralEp1Cover} from './Episode';
import content from './content.json';
import runtime from './runtime.json';
export const Registration=()=> <>
 <Composition id={content.id} component={ChiralEp1Video} durationInFrames={runtime.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{debugAudit:false,showSafeArea:false}}/>
 <Still id={content.id+'Cover'} component={ChiralEp1Cover} width={W} height={H}/>
</>;
