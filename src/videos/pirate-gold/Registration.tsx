import {Composition,Still} from 'remotion';
import {PirateGoldVideo,PirateGoldCover} from './PirateGold';
import content from './content.json';
import runtime from './runtime.json';
export const Registration=()=> <>
 <Composition id={content.id} component={PirateGoldVideo} durationInFrames={(runtime as any).durationInFrames ?? 202*30} fps={30} width={1080} height={1920}/>
 <Still id={content.id+'Cover'} component={PirateGoldCover} width={1080} height={1920}/>
</>;
