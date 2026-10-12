import profile from '../../shared/profile';
export const VIDEO_WIDTH = profile.video.width;
export const VIDEO_HEIGHT = profile.video.height;
export const FPS = profile.video.fps;

// Coordinates are video pixels. Douyin UI occupies the space outside this box.
export const SAFE_LEFT = profile.safe_area.left;
export const SAFE_RIGHT = profile.safe_area.right;
export const SAFE_TOP = profile.safe_area.top;
export const SAFE_BOTTOM = profile.safe_area.bottom;
export const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT;
export const CONTENT_LEFT = SAFE_LEFT + profile.layout.inner_margin;
export const CONTENT_RIGHT = SAFE_RIGHT - profile.layout.inner_margin;
export const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;
export const SAFE_SIDES = {left: CONTENT_LEFT, right: VIDEO_WIDTH - CONTENT_RIGHT};
export const SUBTITLE_HEIGHT = profile.layout.subtitle_height;
export const BODY_BOTTOM = SAFE_BOTTOM - SUBTITLE_HEIGHT - profile.layout.content_to_subtitle_gap;
