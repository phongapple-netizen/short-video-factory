import React from 'react';
import {Rod} from '../rod-board';

// 分子与手性套件：球棍分子（可镜像、可旋转、可设为无手性）、手掌、手套受体、计数点阵。
// 坐标为 SVG 坐标；所有组件放在 <svg> 内使用。

export const MOL = {
  L: '#2F7BD9', R: '#E8742E', dead: '#B9C0C6', c: '#2B2F33', a: '#E04F5F', b: '#3FB37F', d: '#F2C230', h: '#FFFFFF', bond: '#9AA4AE',
} as const;

export const Ball: React.FC<{x: number; y: number; r: number; color: string}> = ({x, y, r, color}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth={Math.max(1.5, r * 0.08)} />
    <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.3} fill="#fff" opacity={0.45} />
  </g>
);

/**
 * 中心碳 + 四个基团（白、红、绿、黄）。flip=-1 为镜像；turn 为绕竖直轴转动的角度（度），
 * 用投影 cos(turn) 压缩横向，turn=180 等于镜像翻面。achiral 时红、绿两个基团同色，镜像可重合。
 */
export const Molecule: React.FC<{x: number; y: number; s?: number; flip?: number; turn?: number; dim?: number; ring?: string; achiral?: boolean; spin?: number}> =
  ({x, y, s = 1, flip = 1, turn = 0, dim = 1, ring, achiral = false, spin = 0}) => {
    const sx = flip * Math.cos((turn * Math.PI) / 180);
    const arms = [
      {dx: 0, dy: -62, c: MOL.h, r: 16},
      {dx: -56, dy: 34, c: MOL.a, r: 22},
      {dx: 58, dy: 30, c: achiral ? MOL.a : MOL.b, r: 22},
      {dx: 18, dy: 54, c: MOL.d, r: 20},
    ];
    return (
      <g transform={`translate(${x},${y}) rotate(${spin}) scale(${s * sx},${s})`} opacity={dim}>
        {ring && <circle cx={0} cy={0} r={92} fill="none" stroke={ring} strokeWidth={8 / s} opacity={0.9} />}
        {arms.map((a, i) => <Rod key={i} p={{x: 0, y: 0}} q={{x: a.dx, y: a.dy}} color={MOL.bond} width={10} joints={false} />)}
        {arms.map((a, i) => <Ball key={i} x={a.dx} y={a.dy} r={a.r} color={a.c} />)}
        <Ball x={0} y={0} r={20} color={MOL.c} />
      </g>
    );
  };

/** 手掌（掌心朝观众）；flip=-1 为另一只手 */
export const Hand: React.FC<{x: number; y: number; s?: number; flip?: number; color: string; outline?: boolean; dim?: number}> =
  ({x, y, s = 1, flip = 1, color, outline = false, dim = 1}) => {
    const fill = outline ? 'none' : color, stroke = outline ? color : 'rgba(0,0,0,0.35)';
    const dash = outline ? '14 10' : undefined;
    const fingers = [{x: -42, h: 120}, {x: -14, h: 140}, {x: 14, h: 132}, {x: 42, h: 108}];
    return (
      <g transform={`translate(${x},${y}) scale(${s * flip},${s})`} opacity={dim}>
        <rect x={-58} y={-40} width={116} height={130} rx={40} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash} />
        {fingers.map((f, i) => (
          <rect key={i} x={f.x - 12} y={-40 - f.h + 30} width={24} height={f.h} rx={12} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash} />
        ))}
        <rect x={-30} y={-6} width={26} height={96} rx={13} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash}
          transform="rotate(-58 -18 40) translate(-62 6)" />
      </g>
    );
  };

/** 计数点阵：从 (x,y) 开始按列数排布 n 个圆点 */
export const Dots: React.FC<{x: number; y: number; n: number; color: string; cols?: number; r?: number; gap?: number; dim?: number}> =
  ({x, y, n, color, cols = 10, r = 11, gap = 30, dim = 1}) => (
    <g opacity={dim}>
      {Array.from({length: Math.max(0, Math.round(n))}).map((_, i) => (
        <circle key={i} cx={x + (i % cols) * gap} cy={y + Math.floor(i / cols) * gap} r={r} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={2} />
      ))}
    </g>
  );
