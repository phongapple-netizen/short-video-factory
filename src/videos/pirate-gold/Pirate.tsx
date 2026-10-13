import React from 'react';
import {C, PIRATE_COLORS} from './model';

export type Expression = 'neutral' | 'happy' | 'worried' | 'smug';
export type PirateState = 'active' | 'absent';

const INK = '#1B2540';
const SKIN = '#F2C9A0';

// 眉毛 + 嘴巴（4种表情）
const Brows = ({e}: {e: Expression}) => {
  const y = 38;
  if (e === 'happy')
    return (<g stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
      <path d="M44,40 Q56,32 68,38" /><path d="M82,38 Q94,32 106,40" /></g>);
  if (e === 'worried')
    return (<g stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
      <path d="M44,34 Q56,40 68,36" /><path d="M82,36 Q94,40 106,34" /></g>);
  if (e === 'smug')
    return (<g stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
      <path d="M44,36 L68,36" /><path d="M82,32 Q94,28 106,34" /></g>);
  return (<g stroke={INK} strokeWidth={4} strokeLinecap="round">
    <line x1={46} y1={y} x2={66} y2={y} /><line x1={84} y1={y} x2={104} y2={y} /></g>);
};

const Mouth = ({e}: {e: Expression}) => {
  if (e === 'happy')
    return <path d="M60,92 Q75,104 90,92" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
  if (e === 'worried')
    return <path d="M62,96 Q75,88 88,96" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
  if (e === 'smug')
    return <path d="M62,94 Q78,98 90,90" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
  return <line x1={66} y1={94} x2={84} y2={94} stroke={INK} strokeWidth={4} strokeLinecap="round" />;
};

// 配饰
const Accessory = ({id, crown}: {id: number; crown: boolean}) => {
  const col = PIRATE_COLORS[id];
  return (<g>
    {id === 0 && (<g> {/* A：三角船长帽+羽毛+紫围巾 */}
      <path d="M28,52 Q75,-6 122,52 Q98,38 75,44 Q52,38 28,52 Z" fill={INK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M108,30 Q128,10 124,-8 Q112,6 104,26 Z" fill={col} stroke={INK} strokeWidth={3} />
      <rect x={52} y={108} width={46} height={20} rx={10} fill={col} stroke={INK} strokeWidth={4} />
    </g>)}
    {id === 1 && (<g> {/* B：橙色头巾+金耳环 */}
      <path d="M33,58 Q35,18 75,18 Q115,18 117,58 Q95,44 75,46 Q55,44 33,58 Z" fill={col} stroke={INK} strokeWidth={4} />
      <circle cx={40} cy={44} r={7} fill={col} stroke={INK} strokeWidth={3} />
      <circle cx={118} cy={72} r={6} fill="#F2B632" stroke={INK} strokeWidth={3} />
      <rect x={52} y={108} width={46} height={20} rx={10} fill={INK} stroke={INK} strokeWidth={4} opacity={0} />
    </g>)}
    {id === 2 && (<g> {/* C：眼罩+粉围巾 */}
      <line x1={30} y1={48} x2={120} y2={76} stroke={INK} strokeWidth={4} />
      <ellipse cx={92} cy={62} rx={14} ry={16} fill={INK} />
      <rect x={52} y={108} width={46} height={20} rx={10} fill={col} stroke={INK} strokeWidth={4} />
    </g>)}
    {id === 3 && (<g> {/* D：大胡子+蓝小圆帽 */}
      <path d="M40,78 Q75,150 110,78 Q104,120 75,128 Q46,120 40,78 Z" fill="#7A4A21" stroke={INK} strokeWidth={4} />
      <ellipse cx={75} cy={26} rx={34} ry={20} fill={col} stroke={INK} strokeWidth={4} />
      <rect x={52} y={108} width={46} height={20} rx={10} fill={INK} stroke={INK} strokeWidth={4} opacity={0} />
    </g>)}
    {id === 4 && (<g> {/* E：青围巾+鹦鹉 */}
      <rect x={52} y={108} width={46} height={20} rx={10} fill={col} stroke={INK} strokeWidth={4} />
      <g transform="translate(116,118)"> {/* 鹦鹉 */}
        <ellipse cx={0} cy={0} rx={14} ry={18} fill="#37C871" stroke={INK} strokeWidth={3} />
        <circle cx={5} cy={-6} r={3} fill={INK} />
        <path d="M10,-2 L20,2 L10,6 Z" fill="#F58220" stroke={INK} strokeWidth={2} />
        <path d="M-8,14 L-14,24 M0,16 L-4,26 M8,14 L6,24" stroke="#37C871" strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>)}
  </g>);
};

export const Pirate: React.FC<{
  id: number; expression?: Expression; state?: PirateState; crown?: boolean; frame?: number;
}> = ({id, expression = 'neutral', state = 'active', crown = false, frame = 0}) => {
  const blink = (frame % 90) < 7;
  const breathe = 1 + 0.012 * Math.sin((frame / 60) * Math.PI * 2);
  const dim = state === 'absent';
  return (
    <svg viewBox="0 0 150 230" width={150} height={230}
      style={{opacity: dim ? 0.2 : 1, filter: dim ? 'grayscale(1)' : undefined}}>
      <ellipse cx={75} cy={218} rx={46} ry={10} fill={INK} opacity={0.18} />
      <g style={{transform: `scale(1, ${breathe})`, transformOrigin: '75px 218px'}}>
        {/* 身体 */}
        <path d="M45,128 Q75,112 105,128 L112,200 Q75,214 38,200 Z"
          fill={PIRATE_COLORS[id]} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* 手臂 */}
        <ellipse cx={36} cy={160} rx={12} ry={22} fill={PIRATE_COLORS[id]} stroke={INK} strokeWidth={4} />
        <ellipse cx={114} cy={160} rx={12} ry={22} fill={PIRATE_COLORS[id]} stroke={INK} strokeWidth={4} />
        {/* 腿 */}
        <rect x={56} y={198} width={16} height={20} rx={8} fill={INK} />
        <rect x={78} y={198} width={16} height={20} rx={8} fill={INK} />
        {/* 头 */}
        <ellipse cx={75} cy={68} rx={44} ry={42} fill={SKIN} stroke={INK} strokeWidth={4} />
        {/* 眼睛 */}
        {blink ? (<g stroke={INK} strokeWidth={4} strokeLinecap="round">
          <line x1={48} y1={64} x2={68} y2={64} /><line x1={82} y1={64} x2={102} y2={64} />
        </g>) : (<g>
          <ellipse cx={58} cy={64} rx={10} ry={12} fill="#fff" stroke={INK} strokeWidth={3} />
          <ellipse cx={92} cy={64} rx={10} ry={12} fill="#fff" stroke={INK} strokeWidth={3} />
          {id !== 2 && <circle cx={60} cy={67} r={4.5} fill={INK} />}
          <circle cx={90} cy={67} r={4.5} fill={INK} />
          {id === 2 && <circle cx={60} cy={67} r={4.5} fill={INK} />}
        </g>)}
        <Brows e={expression} />
        {id !== 3 && <Mouth e={expression} />}
        <Accessory id={id} crown={crown} />
        {/* 提议者皇冠（通用） */}
        {crown && (<g transform="translate(75,2)">
          <path d="M-22,10 L-18,-8 L-9,2 L0,-12 L9,2 L18,-8 L22,10 Z" fill="#F2B632" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <rect x={-22} y={10} width={44} height={8} rx={4} fill="#F2B632" stroke={INK} strokeWidth={3} />
        </g>)}
      </g>
    </svg>
  );
};
