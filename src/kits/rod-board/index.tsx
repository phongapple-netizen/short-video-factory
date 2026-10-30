import React from 'react';
import {Easing, interpolate} from 'remotion';

// 教具白板套件：教室背景、带镜头运动的白板、立体彩色小棍与关节球、沿棍标注、根号公式。
// 几何、力学示意、化学装置简图都可复用；坐标以白板左上角为原点，y 向下。

export const FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
export const MATH_FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
export const ROD = {
  blue: '#2F86D6', red: '#D93A3A', green: '#2DAA3F', orange: '#E8902E', gray: '#8C96A0', ink: '#1E2A36',
  joint: '#F2C230', board: '#FBFBF8', wall: '#9FD3DC', frame: '#F2D02B', floor: '#E9E2D2',
} as const;

export type Pt = {x: number; y: number};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 教室：浅蓝墙、黄色窗框、浅色地面 */
export const Classroom: React.FC<{width: number; height: number}> = ({width, height}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width, height, background: ROD.wall}}>
    {[0, 1, 2, 3].map(i => (
      <div key={i} style={{position: 'absolute', left: 60 + i * 300, top: 0, width: 26, height: 420,
        background: `linear-gradient(90deg, #C9A915, ${ROD.frame} 40%, #FFF27A 55%, #C9A915)`}} />
    ))}
    <div style={{position: 'absolute', left: 0, top: 120, width, height: 24, background: `linear-gradient(#FFF27A, ${ROD.frame} 50%, #C9A915)`}} />
    <div style={{position: 'absolute', left: 0, top: height * 0.72, width, height: height * 0.28, background: ROD.floor}} />
  </div>
);

/**
 * 白板：intro 0→1 时镜头从斜侧转到正面并推近。
 * 子元素使用白板坐标（width×height）。
 */
export const Board: React.FC<{left: number; top: number; width: number; height: number; intro?: number; children: React.ReactNode}> =
  ({left, top, width, height, intro = 1, children}) => {
    const e = Easing.bezier(0.22, 1, 0.36, 1)(Math.min(1, Math.max(0, intro)));
    const rotY = interpolate(e, [0, 1], [-24, 0]), rotX = interpolate(e, [0, 1], [7, 0]), scale = interpolate(e, [0, 1], [0.92, 1]);
    return (
      <div style={{position: 'absolute', left, top, width, height, perspective: 2200, perspectiveOrigin: '50% 40%'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width, height, transformOrigin: '50% 50%',
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`,
          background: ROD.board, borderRadius: 14, boxShadow: '0 18px 40px rgba(20,40,60,0.28), inset 0 0 0 6px #E4E6E1'}}>
          {children}
        </div>
      </div>
    );
  };

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(Math.min(255, Math.max(0, v * f))));
  return `rgb(${c.join(',')})`;
};

/** 立体小棍：grow 0..1 从 p 长向 q；dashed 用于辅助线 */
export const Rod: React.FC<{p: Pt; q: Pt; color: string; grow?: number; width?: number; opacity?: number; dashed?: boolean; joints?: boolean}> =
  ({p, q, color, grow = 1, width = 15, opacity = 1, dashed = false, joints = true}) => {
    if (grow <= 0 || opacity <= 0) return null;
    const e = {x: p.x + (q.x - p.x) * grow, y: p.y + (q.y - p.y) * grow};
    const L = Math.hypot(e.x - p.x, e.y - p.y) || 1, nx = -(e.y - p.y) / L, ny = (e.x - p.x) / L, o = width * 0.18;
    const dash = dashed ? `${width * 1.4} ${width}` : undefined;
    return (
      <g opacity={opacity}>
        <line x1={p.x + 3} y1={p.y + 5} x2={e.x + 3} y2={e.y + 5} stroke="rgba(0,0,0,0.18)" strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
        <line x1={p.x} y1={p.y} x2={e.x} y2={e.y} stroke={shade(color, 0.72)} strokeWidth={width + 3} strokeLinecap="round" strokeDasharray={dash} />
        <line x1={p.x} y1={p.y} x2={e.x} y2={e.y} stroke={color} strokeWidth={width - 2} strokeLinecap="round" strokeDasharray={dash} />
        <line x1={p.x + nx * o} y1={p.y + ny * o} x2={e.x + nx * o} y2={e.y + ny * o} stroke={shade(color, 1.45)} strokeWidth={width * 0.22}
          strokeLinecap="round" opacity={0.8} strokeDasharray={dash} />
        {joints && !dashed && [p, e].map((j, i) => (
          <g key={i}><circle cx={j.x} cy={j.y} r={width * 0.62} fill={ROD.joint} stroke={shade(ROD.joint, 0.7)} strokeWidth={2} />
            <circle cx={j.x - width * 0.18} cy={j.y - width * 0.18} r={width * 0.2} fill="#FFF7C2" /></g>
        ))}
      </g>
    );
  };

/** 半透明填充多边形 */
export const Fill: React.FC<{points: Pt[]; color: string; opacity: number}> = ({points, color, opacity}) =>
  opacity > 0 ? <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill={color} opacity={opacity} /> : null;

/** 根号：上横线覆盖被开方式 */
export const Sqrt: React.FC<{color: string; size: number; children: React.ReactNode}> = ({color, size, children}) => (
  <span style={{display: 'inline-flex', alignItems: 'stretch', color, whiteSpace: 'nowrap'}}>
    <span style={{fontSize: size * 1.12, lineHeight: 1, fontWeight: 700, transform: `translateY(${size * 0.04}px)`}}>√</span>
    <span style={{borderTop: `${Math.max(3, size * 0.075)}px solid ${color}`, paddingTop: size * 0.04, lineHeight: 1.1}}>{children}</span>
  </span>
);
export const Sup: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{fontSize: '0.62em', verticalAlign: '0.62em', lineHeight: 0}}>{children}</span>
);

/** 沿棍标注：放在 p→q 的一侧（side=1 为法线方向），文字始终正向可读 */
export const RodLabel: React.FC<{p: Pt; q: Pt; side?: 1 | -1; gap?: number; color: string; size?: number; opacity?: number; rotate?: boolean; children: React.ReactNode}> =
  ({p, q, side = 1, gap = 34, color, size = 40, opacity = 1, rotate = true, children}) => {
    if (opacity <= 0) return null;
    const L = Math.hypot(q.x - p.x, q.y - p.y) || 1, nx = -(q.y - p.y) / L * side, ny = (q.x - p.x) / L * side;
    let ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    const mx = (p.x + q.x) / 2 + nx * gap, my = (p.y + q.y) / 2 + ny * gap;
    return (
      <div data-safe style={{position: 'absolute', left: mx, top: my, transform: `translate(-50%,-50%) rotate(${rotate ? ang : 0}deg)`,
        fontFamily: MATH_FONT, fontSize: size, fontWeight: 800, color, whiteSpace: 'nowrap', opacity,
        textShadow: '0 0 6px #fff, 0 0 6px #fff'}}>{children}</div>
    );
  };

/** 0→1 缓动进度 */
export const progress = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, Math.max(a + 1, b)], [0, 1], {...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1)});
