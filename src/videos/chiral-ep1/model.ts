// 数据自检：上集的 ee 例子与卡根 ML₂ 模型。断言失败直接报错。
// ML₂：手性配体 L/R 两两结合成 LL、RR（同手，能催化）和 LR（异手，不干活）。
// 归一化：2x+z = 1+e，2y+z = 1−e，z² = K·x·y（x=LL, y=RR, z=LR），产物 ee = (x−y)/(x+y) = e/(1−z)。

export const eeOf = (major: number, minor: number) => (major - minor) / (major + minor);

export const EE_EXAMPLE = {L: 70, R: 30} as const;

/** ML₂ 模型中异手配合物的份额 z（K=4 为随机配对） */
export function heteroShare(e: number, K = 4): number {
  if (Math.abs(K - 4) < 1e-12) return (1 - e * e) / 2;
  // (4−K)z² + 2Kz − K(1−e²) = 0，取 [0, 1−|e|] 内的根
  const a = 4 - K, b = 2 * K, c = -K * (1 - e * e);
  const disc = Math.sqrt(b * b - 4 * a * c);
  const roots = [(-b + disc) / (2 * a), (-b - disc) / (2 * a)];
  return roots.find(z => z >= -1e-12 && z <= 1 - Math.abs(e) + 1e-12)!;
}
/** 产物 ee（理想情况下纯催化剂给出 100% ee） */
export const productEe = (e: number, K = 4) => (e <= 0 ? 0 : e >= 1 ? 1 : e / (1 - heteroShare(e, K)));

// 20 个催化剂分子（14 L + 6 R）配成 10 对：按模型份额取整
export const CAT = {L: 14, R: 6} as const;
export const CAT_EE = eeOf(CAT.L, CAT.R);
const zz = heteroShare(CAT_EE), xx = (1 + CAT_EE - zz) / 2, yy = (1 - CAT_EE - zz) / 2;
export const PAIRS = {LL: Math.round(xx * 10), RR: Math.round(yy * 10), LR: Math.round(zz * 10)};
export const PAIR_EE = eeOf(PAIRS.LL, PAIRS.RR);

// ---- 自检 ----
if (Math.abs(eeOf(EE_EXAMPLE.L, EE_EXAMPLE.R) - 0.4) > 1e-12) throw new Error('[model] ee 例子应为 40%');
if (PAIRS.LL + PAIRS.RR + PAIRS.LR !== 10) throw new Error('[model] 应正好 10 对');
if (2 * PAIRS.LL + PAIRS.LR !== CAT.L || 2 * PAIRS.RR + PAIRS.LR !== CAT.R) throw new Error('[model] 配对后左右手个数不守恒');
if (!(productEe(CAT_EE) > CAT_EE)) throw new Error('[model] 应为正非线性效应');
if (!(PAIR_EE > CAT_EE && Math.abs(PAIR_EE - productEe(CAT_EE)) < 0.05)) throw new Error('[model] 配对示意与曲线不一致');
for (const e of [0, 0.2, 0.5, 0.8, 1]) if (productEe(e) + 1e-12 < e) throw new Error('[model] 曲线应在对角线之上');
