import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const fontFamily = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const gold = '#FCD34D';
const pirates = ['老大', '老二', '老三', '老四', '老五'];

type Scene = {
  start: number;
  end: number;
  tag: string;
  title: string;
  lines: string[];
  coins?: number[];
  emphasis?: string;
};

// 题设：投票达到半数即通过；未通过则提案者出局。
// 海盗优先保命，其次多拿金币。各人有能力倒推下一轮的结果。
const scenes: Scene[] = [
  {start: 0, end: 150, tag: '趣味博弈 · 01', title: '五个海盗\n分100枚金币',
   lines: ['为什么老大最后能拿到98枚？'], emphasis: '答案藏在倒推里'},
  {start: 150, end: 390, tag: '游戏规则', title: '不通过，就出局',
   lines: ['按老大到老五的顺序提出方案。', '赞成票达到半数，方案通过。', '否则提案者出局，下一人继续。'],
   emphasis: '每个人都想活命、拿更多金币'},
  {start: 390, end: 615, tag: '倒推 · 只剩两人', title: '老四：100枚',
   lines: ['老四投自己一票即可。', '1票 / 2人 = 半数，方案通过。'],
   coins: [100, 0], emphasis: '老五将一无所获'},
  {start: 615, end: 855, tag: '倒推 · 剩三人', title: '老三：99枚',
   lines: ['老三只需再争取一票。', '老五若等下一轮会拿到0枚，', '给他1枚，他就会支持。'],
   coins: [99, 0, 1], emphasis: '老三、老五赞成'},
  {start: 855, end: 1110, tag: '倒推 · 剩四人', title: '老二：99枚',
   lines: ['老二需要2票，自己已有1票。', '老四在下一轮只能拿到0枚。', '给老四1枚，就能通过。'],
   coins: [99, 0, 1, 0], emphasis: '老二、老四赞成'},
  {start: 1110, end: 1560, tag: '最后 · 五人全在', title: '老大：98枚！',
   lines: ['老大需要3票：自己 + 另外2人。', '老三、老五在下一轮都拿0枚。', '各给他们1枚，就买到两票。'],
   coins: [98, 0, 1, 0, 1], emphasis: '最终方案：98 / 0 / 1 / 0 / 1'},
  {start: 1560, end: 1800, tag: '关键思路', title: '从结局往前推',
   lines: ['先算“如果我出局，下个人怎么分”。', '再用最少的金币，换足够的选票。'],
   emphasis: '这就是逆向归纳法'}
];

const CoinAllocation: React.FC<{coins: number[]; frame: number}> = ({coins, frame}) => {
  const offset = 5 - coins.length;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 21, marginTop: 65}}>
      {coins.map((value, i) => {
        const reveal = interpolate(
          frame, [i * 8, i * 8 + 15], [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
        );
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 34px', borderRadius: 24,
            background: value > 0 ? 'rgba(252,211,77,.16)' : 'rgba(255,255,255,.07)',
            border: value > 0 ? '2px solid rgba(252,211,77,.55)' : '2px solid rgba(255,255,255,.12)',
            opacity: reveal,
            transform: 'translateY(' + ((1 - reveal) * 15) + 'px)'
          }}>
            <span style={{fontSize: 48, fontWeight: 700}}>{pirates[offset + i]}</span>
            <span style={{fontSize: 54, fontWeight: 900, color: value > 0 ? gold : '#D0D7E3'}}>
              {value} <span style={{fontSize: 32}}>枚</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const PirateCoins: React.FC = () => {
  const frame = useCurrentFrame();
  const current = scenes.find((scene) => frame >= scene.start && frame < scene.end) ?? scenes[scenes.length - 1];
  const local = frame - current.start;
  const opacity = interpolate(
    local, [0, 15, current.end - current.start - 12, current.end - current.start],
    [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const titleRise = interpolate(local, [0, 25], [45, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(155deg, #07152F, #112B57)',
      color: '#F8FAFC', fontFamily, overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: -240, right: -350,
        width: 830, height: 830, borderRadius: '50%',
        border: '4px solid rgba(252,211,77,.12)'
      }} />
      <div style={{
        position: 'absolute', top: 95, left: 72, right: 72,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{color: gold, fontSize: 37, fontWeight: 750}}>数学思维 · 博弈论</span>
        <span style={{fontSize: 32, color: '#B8C7E1'}}>01 / 01</span>
      </div>
      <div style={{position: 'absolute', left: 70, right: 70, top: 255, opacity}}>
        <div style={{color: gold, fontWeight: 850, fontSize: 37, marginBottom: 35}}>
          {current.tag}
        </div>
        <div style={{
          whiteSpace: 'pre-line', fontWeight: 900, fontSize: 89, lineHeight: 1.28,
          transform: 'translateY(' + titleRise + 'px)'
        }}>{current.title}</div>
        <div style={{marginTop: 58, fontSize: 43, lineHeight: 1.73, color: '#E4EDF9'}}>
          {current.lines.map((line) => <div key={line}>{line}</div>)}
        </div>
        {current.coins && <CoinAllocation coins={current.coins} frame={local} />}
      </div>
      <div style={{
        position: 'absolute', left: 70, right: 70, bottom: 205,
        borderLeft: '7px solid ' + gold, paddingLeft: 28, opacity
      }}>
        <div style={{fontSize: 40, color: gold, fontWeight: 850}}>{current.emphasis}</div>
      </div>
      <div style={{
        position: 'absolute', left: 70, right: 70, bottom: 95,
        height: 9, background: 'rgba(255,255,255,.18)', borderRadius: 10
      }}>
        <div style={{
          width: (((frame + 1) / 1800) * 100) + '%',
          height: '100%', background: gold, borderRadius: 10
        }} />
      </div>
    </AbsoluteFill>
  );
};
