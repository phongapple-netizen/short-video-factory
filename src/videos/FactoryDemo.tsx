import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const fontFamily = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';

export const FactoryDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const appear = spring({frame, fps, config: {damping: 200}, durationInFrames: 32});
  const scale = interpolate(appear, [0, 1], [0.82, 1]);
  const dots = Array.from({length: 9}, (_, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const wave = Math.sin(frame / 12 + index * 0.65) * 15;
    return (
      <div key={index} style={{
        position: 'absolute', top: 270 + row * 165 + wave,
        left: 200 + col * 250, width: 100, height: 100,
        borderRadius: 30, background: index % 2 ? '#38BDF8' : '#FDE68A',
        opacity: 0.85
      }} />
    );
  });
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(160deg, #061328, #0D2762)',
      fontFamily, color: 'white', overflow: 'hidden'
    }}>
      {dots}
      <div style={{
        position: 'absolute', top: 950, width: '100%', textAlign: 'center',
        transform: 'scale(' + scale + ')', opacity: appear
      }}>
        <div style={{fontSize: 100, fontWeight: 900, lineHeight: 1.25}}>短视频工厂</div>
        <div style={{fontSize: 48, marginTop: 40, color: '#BAE6FD'}}>Remotion × GitHub Actions</div>
      </div>
      <div style={{
        position: 'absolute', top: 1490, left: 90, right: 90,
        fontSize: 40, lineHeight: 1.6, textAlign: 'center', color: '#DCE8FF'
      }}>一个仓库 · 多部短片 · 云端渲染</div>
      <div style={{
        position: 'absolute', bottom: 120, width: '100%',
        textAlign: 'center', fontSize: 32, color: '#93C5FD'
      }}>12秒测试动画 · 1080×1920 · 30fps</div>
    </AbsoluteFill>
  );
};
