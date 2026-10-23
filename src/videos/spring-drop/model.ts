// 数据自检：有质量的弹簧（密绕拉簧）+ 铁球，剪断后的一维运动。
// 弹簧离散成 N 段：每段只受拉、不能短于原长（密绕），碰到原长时按完全非弹性处理。
// 画面上的悬停时间、落地差、曲线都从这里读取；断言失败直接报错。

export const P = {
  M: 1.0,      // 球的质量 kg
  ms: 0.05,    // 整根弹簧质量 kg
  k: 200,      // 整根弹簧劲度系数 N/m
  L0: 0.25,    // 整根弹簧原长 m（密绕）
  h: 1.2,      // 球下落到地面的高度 m
  g: 9.8,
  N: 24,
} as const;

export type Sample = {t: number; nodes: number[]; ball: number; cm: number};
export type Drop = {hover: number; landing: number; samples: Sample[]; stretch: number; tEnd: number; endBall: number; endV: number};

/** springMass/stiff/rest 为挂在球上方、剪断后自由的那段弹簧 */
function simulate(springMass: number, stiff: number, rest: number): Drop {
  const {M, g, N, h} = P;
  const kSeg = stiff * N, l0 = rest / N, mNode = springMass / N;
  const mass = Array.from({length: N + 1}, (_, i) => (i === 0 || i === N ? mNode / 2 : mNode) + (i === N ? M : 0));
  // 静止悬挂：第 i 段拉力 = 它下面的总重
  const y: number[] = [0];
  for (let i = 0; i < N; i++) {
    const below = mass.slice(i + 1).reduce((a, b) => a + b, 0);
    y.push(y[i] + l0 + (below * g) / kSeg);
  }
  const v = new Array(N + 1).fill(0);
  const y0 = [...y], total = mass.reduce((a, b) => a + b, 0);
  const cmOf = () => y.reduce((s, yi, i) => s + yi * mass[i], 0) / total;
  const cm0 = cmOf();
  const dt = 2e-6, tEnd = 0.12;
  const samples: Sample[] = [];
  let hover = -1;
  for (let step = 0, t = 0; t <= tEnd + 1e-12; step++, t = step * dt) {
    if (step % 250 === 0) samples.push({t, nodes: y.map((yi, i) => yi - y0[i]), ball: y[N] - y0[N], cm: cmOf() - cm0});
    if (hover < 0 && y[N] - y0[N] > 1e-5) hover = t;
    const f = mass.map(m => m * g);
    for (let i = 0; i < N; i++) {
      const tension = kSeg * Math.max(0, y[i + 1] - y[i] - l0);
      f[i] += tension; f[i + 1] -= tension;
    }
    for (let i = 0; i <= N; i++) { v[i] += (f[i] / mass[i]) * dt; y[i] += v[i] * dt; }
    // 密绕：段长不能小于原长，碰上即一起运动
    for (let pass = 0; pass < 2; pass++)
      for (let i = N - 1; i >= 0; i--) if (y[i + 1] - y[i] < l0) {
        const p = (mass[i] * v[i] + mass[i + 1] * v[i + 1]) / (mass[i] + mass[i + 1]);
        v[i] = p; v[i + 1] = p; y[i] = y[i + 1] - l0;
      }
  }
  // 收缩结束后整体刚性下落：解析求球再走完剩余高度的时间
  const s = y[N] - y0[N], u = v[N], rem = h - s;
  if (Math.max(...v) - Math.min(...v) > 1e-3) throw new Error('[model] 0.12 s 时弹簧尚未收缩完毕');
  const landing = tEnd + (-u + Math.sqrt(u * u + 2 * g * rem)) / g;
  return {hover, landing, samples, stretch: (M * g) / stiff, tEnd, endBall: s, endV: u};
}

export const FREE_LANDING = Math.sqrt((2 * P.h) / P.g);
export const DROP_A = simulate(P.ms, P.k, P.L0);           // 整根弹簧随球下落
export const DROP_B = simulate(P.ms / 2, P.k * 2, P.L0 / 2); // 中间剪断：下半根弹簧随球下落
export const LAG_A = DROP_A.landing - FREE_LANDING;
export const LAG_B = DROP_B.landing - FREE_LANDING;

// ---- 自检 ----
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol * b;
if (!near(DROP_A.hover, Math.sqrt(P.ms / P.k), 0.3)) throw new Error(`[model] A 悬停时间异常 ${DROP_A.hover}`);
if (!near(DROP_B.hover, Math.sqrt(P.ms / 2 / (P.k * 2)), 0.3)) throw new Error(`[model] B 悬停时间异常 ${DROP_B.hover}`);
if (!(LAG_A > 0 && LAG_B > 0 && LAG_B < LAG_A && LAG_A < 0.005)) throw new Error(`[model] 落地差异常 ${LAG_A} ${LAG_B}`);
for (const d of [DROP_A, DROP_B]) {
  const last = d.samples[d.samples.length - 1];
  if (!near(last.cm, 0.5 * P.g * last.t ** 2, 0.01)) throw new Error('[model] 重心应自由下落');
}

const sampleAt = (d: Drop, t: number) => {
  const i = Math.min(d.samples.length - 2, Math.max(0, Math.floor(t / (d.samples[1].t - d.samples[0].t))));
  const a = d.samples[i], b = d.samples[i + 1], f = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  return {a, b, f};
};
/** 球的下落位移 m；drop 为 null 时是自由落体（C） */
export function ballAt(drop: Drop | null, t: number): number {
  if (t <= 0) return 0;
  if (!drop) return 0.5 * P.g * t * t;
  if (t <= drop.tEnd) { const {a, b, f} = sampleAt(drop, t); return a.ball + (b.ball - a.ball) * f; }
  const u = t - drop.tEnd;
  return drop.endBall + drop.endV * u + 0.5 * P.g * u * u;
}
/** 第 i 个弹簧节点的位移 m（只用于收缩阶段，t ≤ tEnd） */
export function nodeAt(drop: Drop, i: number, t: number): number {
  if (t <= 0) return 0;
  const {a, b, f} = sampleAt(drop, Math.min(t, drop.tEnd));
  return a.nodes[i] + (b.nodes[i] - a.nodes[i]) * f;
}
export const cmAt = (t: number) => (t <= 0 ? 0 : 0.5 * P.g * t * t);
