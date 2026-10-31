// 数据自检：下集的“只多 1 个”、单纯复制不改比例、异手配对放大（简化示意）与 2003 年三轮数据。
import content from './content.json';

export const eeOf = (major: number, minor: number) => (major - minor) / (major + minor);

// 两百万个里多 1 个
export const MILLION = {L: 1_000_001, R: 1_000_000} as const;
export const MILLION_EE = eeOf(MILLION.L, MILLION.R);

// 单纯复制：比例不变
export const COPY = {before: {L: 51, R: 49}, after: {L: 102, R: 98}} as const;

/** 简化示意：每轮能干活的催化剂翻倍，再让 80%（取整）的少数派与多数派配成异手对、罢工 */
export type Round = {round: number; L: number; R: number; doubled: {L: number; R: number}; paired: number; ee: number};
export function toyRounds(L0 = 51, R0 = 49, rounds = 5, pairFrac = 0.8): Round[] {
  const out: Round[] = [{round: 0, L: L0, R: R0, doubled: {L: L0, R: R0}, paired: 0, ee: eeOf(L0, R0)}];
  let L = L0, R = R0;
  for (let r = 1; r <= rounds; r++) {
    const dL = 2 * L, dR = 2 * R, p = Math.floor(pairFrac * Math.min(dL, dR));
    L = dL - p; R = dR - p;
    out.push({round: r, L, R, doubled: {L: dL, R: dR}, paired: p, ee: eeOf(L, R)});
  }
  return out;
}
export const TOY = toyRounds();

export const SOAI = [
  {round: 0, ee: 0.0000005, label: '约0.00005%'},
  {round: 1, ee: 0.57, label: '57%'},
  {round: 2, ee: 0.99, label: '99%'},
  {round: 3, ee: 0.995, label: '>99.5%'},
] as const;

// ---- 自检 ----
if (Math.abs(MILLION_EE * 100 - 0.00005) > 0.000001) throw new Error('[model] 两百万里多 1 个应约为 0.00005%');
if (eeOf(COPY.before.L, COPY.before.R) !== eeOf(COPY.after.L, COPY.after.R)) throw new Error('[model] 单纯翻倍不应改变 ee');
for (let i = 1; i < TOY.length; i++) {
  const a = TOY[i - 1], b = TOY[i];
  if (b.L - b.R !== 2 * (a.L - a.R)) throw new Error('[model] 配对不应改变两边的差，翻倍使差加倍');
  if (!(b.ee > a.ee)) throw new Error('[model] 示意中 ee 应逐轮升高');
  if (b.R < 0) throw new Error('[model] 个数不能为负');
}
if (JSON.stringify(content.model.soaiRounds.map(r => r.ee)) !== JSON.stringify(SOAI.map(r => r.label))) throw new Error('[model] 轮次数据与 content.json 不一致');
