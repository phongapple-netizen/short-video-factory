import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SAFE as PROFILE_SAFE} from '../../shared/profile';
import {useFrameAudit} from '../../shared/story';
import {FONT, progress} from '../rod-board';

// 单集外壳：品牌行、每镜标题（第一镜不淡入）、字幕、逐句配音、审计与安全区显示。
// 各集只需提供 runtime、content 和 {镜号: 场景组件}。

export const W = 1080, H = 1920;
export const SAFE = {x0: PROFILE_SAFE.left + 15, x1: PROFILE_SAFE.right - 15};
export const CX = (SAFE.x0 + SAFE.x1) / 2;

export type Cue = {id: string; scene: string; start: number; end: number; text: string; audio?: string | null};
export type Runtime = {scenes: {id: string; start: number; end: number}[]; durationInFrames: number; captions: Cue[]};
export type SceneProps = {frame: number; fps: number};
type Content = {brand: string; scenes: {id: string; title: string}[]};

/** cue 在所属场景内的开始秒数；frac 取 cue 时长的比例 */
export const makeCueAt = (rt: Runtime, label: string) => (id: string, frac = 0): number => {
  const cue = rt.captions.find(c => c.id === id);
  if (!cue) throw new Error(`${label} missing cue ${id}`);
  const scene = rt.scenes.find(s => s.id === cue.scene)!;
  return cue.start - scene.start + frac * (cue.end - cue.start);
};

export const pop = (frame: number, at: number) => {
  const s = spring({frame: frame - at, fps: 30, config: {damping: 10, stiffness: 170}});
  return {opacity: progress(frame, at, at + 5), transform: `scale(${Math.max(0.01, s)})`};
};
export const enter = (frame: number, at: number) => ({
  opacity: progress(frame, at, at + 12), transform: `translateY(${interpolate(progress(frame, at, at + 12), [0, 1], [20, 0])}px)`,
});

export const Banner: React.FC<{text: React.ReactNode; frame: number; at: number; top: number; tone?: string; size?: number; ink?: string}> =
  ({text, frame, at, top, tone = '#1E2A36', size = 40, ink = '#1E2A36'}) => (
    <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, boxSizing: 'border-box', top, textAlign: 'center',
      background: '#FFFFFF', border: `4px solid ${tone}`, borderRadius: 26, padding: '12px 16px', whiteSpace: 'pre-line',
      fontFamily: FONT, fontSize: size, fontWeight: 900, lineHeight: 1.3, color: ink, ...enter(frame, at)}}>{text}</div>
  );

export const Label: React.FC<{text: React.ReactNode; x: number; y: number; color: string; frame: number; at: number; w?: number; size?: number; boxed?: boolean}> =
  ({text, x, y, color, frame, at, w = 260, size = 36, boxed = true}) => (
    <div data-safe style={{position: 'absolute', left: x - w / 2, top: y, width: w, boxSizing: 'border-box', textAlign: 'center',
      background: boxed ? '#FFFFFF' : 'transparent', border: boxed ? `4px solid ${color}` : 'none', borderRadius: 20, padding: boxed ? '6px 4px' : 0,
      fontFamily: FONT, fontSize: size, fontWeight: 900, color, whiteSpace: 'pre-line', lineHeight: 1.25, ...pop(frame, at)}}>{text}</div>
  );

export const EpisodeShell: React.FC<{
  rt: Runtime; content: Content; scenes: Record<string, React.FC<SceneProps>>; tag: string; background: React.ReactNode;
  titleOverride?: Record<string, React.ReactNode>; firstTitlePx?: number; debugAudit?: boolean; showSafeArea?: boolean;
}> = ({rt, content, scenes, tag, background, titleOverride = {}, firstTitlePx = 96, debugAudit = false, showSafeArea = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = React.useRef<HTMLDivElement>(null);
  useFrameAudit(ref, frame, debugAudit);
  const seconds = frame / fps;
  let idx = rt.scenes.findIndex(s => seconds >= s.start && seconds < s.end);
  if (idx < 0) idx = rt.scenes.length - 1;
  const sc = rt.scenes[idx];
  const Scene = scenes[sc.id];
  const local = Math.round(frame - sc.start * fps);
  const first = idx === 0;
  const cue = [...rt.captions].reverse().find(c => c.scene === sc.id && seconds >= c.start && seconds < c.end + 0.6);
  return (
    <AbsoluteFill ref={ref} style={{fontFamily: FONT}}>
      {background}
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex',
        justifyContent: 'space-between', fontFamily: FONT, fontSize: 32, fontWeight: 800, color: '#5D6B74'}}>
        <span>{content.brand}</span><span>{tag}</span>
      </div>
      <div data-safe data-title style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 220, textAlign: 'center',
        fontFamily: FONT, fontSize: first ? firstTitlePx : 88, lineHeight: 1.1, fontWeight: 900, color: '#1E2A36', whiteSpace: 'pre-line',
        opacity: first ? 1 : progress(local, -5, 8)}}>
        {titleOverride[sc.id] ?? content.scenes[idx].title}
      </div>
      <Scene frame={local} fps={fps} />
      {cue && (
        <div data-safe data-caption style={{position: 'absolute', left: SAFE.x0, top: 1360, width: SAFE.x1 - SAFE.x0, minHeight: 124,
          boxSizing: 'border-box', background: 'rgba(255,255,255,0.96)', border: '1px solid #CFD8D2', borderRadius: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-line',
          fontFamily: FONT, fontSize: 40, fontWeight: 600, color: '#1E2A36', padding: '8px 24px', lineHeight: 1.35}}>
          {cue.text}
        </div>
      )}
      {rt.captions.filter(c => c.audio).map(c => (
        <Sequence key={c.id} from={Math.round(c.start * fps)} durationInFrames={Math.ceil((c.end - c.start) * fps)} premountFor={fps}>
          <Audio src={staticFile(c.audio!)} />
        </Sequence>
      ))}
      {showSafeArea && (
        <svg width={W} height={H} style={{position: 'absolute'}}>
          <rect x={PROFILE_SAFE.left} y={PROFILE_SAFE.top} width={PROFILE_SAFE.right - PROFILE_SAFE.left}
            height={PROFILE_SAFE.bottom - PROFILE_SAFE.top} fill="none" stroke="#C72C44" strokeDasharray="12 8" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/** 化学实验室背景：浅绿网格纸 */
export const LabPaper: React.FC = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: '#F3F6F2',
    backgroundImage: 'linear-gradient(#DDE7DF 2px, transparent 2px), linear-gradient(90deg, #DDE7DF 2px, transparent 2px)', backgroundSize: '60px 60px'}} />
);
