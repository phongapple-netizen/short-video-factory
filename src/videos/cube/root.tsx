import { Composition, Still } from "remotion";
import { MathExplainer } from "./video";
import { CheckStill, DouyinCover } from "./video";
import {VIDEO_WIDTH, VIDEO_HEIGHT, FPS} from './layout';
import timeline from './timeline.json';

export const RemotionRoot = () => (
  <>
    <Composition
      id="MathExplainer"
      component={MathExplainer}
      durationInFrames={timeline.ending.end * FPS}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{showSafeArea: false}}
    />
    <Still id="CheckStill" component={CheckStill} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />
    <Still id="DouyinCover" component={DouyinCover} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} defaultProps={{showSafeArea:false}} />
  </>
);
