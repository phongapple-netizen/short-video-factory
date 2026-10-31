// 数据自检：手性放大。画面上的数量、ee、轮次都从这里读取；断言失败直接报错。
import content from './content.json';

/** 对映体过量 ee = (多数 − 少数) / 总数 */
export const eeOf = (major: number, minor: number) => (major - minor) / (major + minor);
/** 给定 ee，N 个分子里多数派的个数（四舍五入） */
export const majorityOf = (ee: number, n: number) => Math.round(((1 + ee) / 2) * n);

// ---- 卡根：储库效应的极端示意（异手配对全部失效） ----
export const KAGAN = {L: 14, R: 6} as const;
export const KAGAN_EE = eeOf(KAGAN.L, KAGAN.R);
export const KAGAN_PAIRS = Math.min(KAGAN.L, KAGAN.R);
export const KAGAN_FREE = {L: KAGAN.L - KAGAN_PAIRS, R: KAGAN.R - KAGAN_PAIRS};

// ---- 硖合：2003 年三轮连续不对称自催化（文献数据） ----
export const SOAI = [
  {round: 0, ee: 0.0000005, label: '约0.00005%'},
  {round: 1, ee: 0.57, label: '57%'},
  {round: 2, ee: 0.99, label: '99%'},
  {round: 3, ee: 0.995, label: '>99.5%'},
] as const;

// ---- 自检 ----
if (Math.abs(KAGAN_EE - 0.4) > 1e-12) throw new Error('[model] 卡根示意的 ee 应为 40%');
if (KAGAN_FREE.R !== 0 || KAGAN_FREE.L !== 8) throw new Error('[model] 配对后应只剩 8 个 L 型');
const listed = content.model.soaiRounds.map(r => r.ee);
if (JSON.stringify(listed) !== JSON.stringify(SOAI.map(r => r.label))) throw new Error('[model] content.json 的轮次数据与模型不一致');
for (let i = 1; i < SOAI.length; i++) if (!(SOAI[i].ee > SOAI[i - 1].ee)) throw new Error('[model] ee 应逐轮升高');
if (majorityOf(SOAI[0].ee, 40) !== 20) throw new Error('[model] 0.00005% 时 40 个分子里看起来仍是一半一半');
