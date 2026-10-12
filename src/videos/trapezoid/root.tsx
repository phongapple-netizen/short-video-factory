import {Composition,Still} from 'remotion';
import {TrapezoidExplainer,Cover} from './video';
import {W,H,FPS} from './layout';
import timeline from './timeline.json';
import {HistoryVideo,HistoryCover} from './history/video';
import historyRuntime from './history/chibi.runtime.json';
import historyData from './history/chibi.json';
import {ChibiMapPreview,MAP_PREVIEW_FRAMES} from './history/map/preview';
import {ChibiMapFull,ChibiMapCover} from './history/map/full';
export const Root=()=> <>
  <Composition id='TrapezoidExplainer' component={TrapezoidExplainer} durationInFrames={timeline.ending.end*FPS} fps={FPS} width={W} height={H} defaultProps={{showSafeArea:false}}/>
  <Still id='Cover' component={Cover} width={W} height={H} defaultProps={{showSafeArea:false}}/>
  <Composition id={historyData.id} component={HistoryVideo} durationInFrames={historyRuntime.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{showSafeArea:false}}/>
  <Still id={historyData.coverId} component={HistoryCover} width={W} height={H} defaultProps={{showSafeArea:false}}/>
  <Composition id='ChibiMapPreview' component={ChibiMapPreview} durationInFrames={MAP_PREVIEW_FRAMES} fps={FPS} width={W} height={H} defaultProps={{showSafeArea:false}}/>
  <Composition id="ChibiMapFull" component={ChibiMapFull} durationInFrames={historyRuntime.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{showSafeArea:false}}/>
  <Still id="ChibiMapCover" component={ChibiMapCover} width={W} height={H}/>
</>;
