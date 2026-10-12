import profile from '../../standards/douyin-profile.json';
export default profile;
export const W=profile.video.width,H=profile.video.height,FPS=profile.video.fps;
export const SAFE=profile.safe_area;
export const SAFE_LEFT=SAFE.left,SAFE_RIGHT=SAFE.right,SAFE_TOP=SAFE.top,SAFE_BOTTOM=SAFE.bottom;
export const LEFT=SAFE_LEFT+profile.layout.inner_margin,RIGHT=SAFE_RIGHT-profile.layout.inner_margin;
export const SIDES={left:LEFT,right:W-RIGHT};
export const FONT=profile.typography.font_stack;
export const THEME=profile.theme;
