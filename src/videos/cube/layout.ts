export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const FPS = 30;

// Coordinates are video pixels. Douyin UI occupies the space outside this box.
export const SAFE_LEFT = 60;
export const SAFE_RIGHT = 930;
export const SAFE_TOP = 160;
export const SAFE_BOTTOM = 1500;
export const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT;
export const CONTENT_LEFT = SAFE_LEFT + 10;
export const CONTENT_RIGHT = SAFE_RIGHT - 10;
export const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;
export const SAFE_SIDES = {left: CONTENT_LEFT, right: VIDEO_WIDTH - CONTENT_RIGHT};
export const SUBTITLE_HEIGHT = 120;
export const BODY_BOTTOM = SAFE_BOTTOM - SUBTITLE_HEIGHT - 16;
