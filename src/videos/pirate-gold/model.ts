// 数据自检：逆向归纳。画面上所有数字、票数、收买价都从这里读取，断言失败直接报错。
//
// 规则：n 个人，提议者为其中资历最高者；所有人投票（含提议者），
// 同意票 >= ceil(n/2)（即“一半或以上”）则通过，否则提议者下海。
// 偏好：保命 > 金币 > 同等收益下更愿意看别人下海。
// 收买价 = 对方“下一轮能拿到的数目” + 1。

export const NAMES = ['A', 'B', 'C', 'D', 'E'] as const;
export const TOTAL_COINS = 100;

export type GameResult = {
  n: number;               // 在场人数
  proposer: number;        // 提议者下标（0=A）
  dist: number[];          // 每人分得（按下标顺序，只含在场者）
  votes: boolean[];        // 每人是否投同意
  yes: number;             // 同意票数
  needed: number;          // 通过所需票数
  pass: boolean;
  prices: (number | null)[]; // 收买价（提议者为 null）
};

/** 一轮博弈：players 为在场者下标（资历从高到低），strict 为“必须超过一半”变体 */
export function solve(players: number[], strict = false): GameResult {
  const n = players.length;
  const proposer = players[0];
  const needed = strict ? Math.floor(n / 2) + 1 : Math.ceil(n / 2);

  if (n === 1) {
    return {n, proposer, dist: [TOTAL_COINS], votes: [true], yes: 1, needed, pass: true,
      prices: [null]};
  }

  // 下一轮（提议者下海后）的结果
  const next = solve(players.slice(1), strict);
  // 每人的收买价 = 下一轮能拿到的 + 1；提议者不需要收买
  const prices: (number | null)[] = players.map((p, i) => {
    if (i === 0) return null;
    const ni = next.dist[players.slice(1).indexOf(p)];
    return ni + 1;
  });

  // 贪心买最便宜的票：按收买价升序，买到凑够 needed 票为止
  const order = players.map((_, i) => i).filter(i => i !== 0)
    .sort((a, b) => (prices[a] as number) - (prices[b] as number));
  const buy = new Set<number>();
  let cost = 0;
  for (const i of order) {
    if (1 + buy.size >= needed) break;
    buy.add(i);
    cost += prices[i] as number;
  }
  if (cost > TOTAL_COINS) {
    // 买不起足够的票 → 任何提案都必败，提议者下海，按下一轮结果分配
    const nd = next.dist;
    return {
      n, proposer,
      dist: players.map((_, i) => (i === 0 ? 0 : nd[i - 1])),
      votes: players.map((_, i) => i !== 0),
      yes: n - 1, needed, pass: false, prices,
    };
  }

  const dist = players.map((_, i) => (i === 0 ? TOTAL_COINS - cost : buy.has(i) ? (prices[i] as number) : 0));
  // 投票：提议者同意；被收买者同意；其余反对
  // （被收买者：price = next+1 > next，同意更优；未被收买者：0 vs 下一轮>=0，
  //  若下一轮也是0则按“更愿意看别人下海”投反对）
  const votes = players.map((_, i) => {
    if (i === 0) return true;
    if (buy.has(i)) return true;
    const ni = next.dist[players.slice(1).indexOf(players[i])];
    return dist[i] > ni; // 只有分得比下一轮多才同意
  });
  const yes = votes.filter(Boolean).length;
  return {n, proposer, dist, votes, yes, needed, pass: yes >= needed, prices};
}

const eq = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b);

// ---- 自检 ----
const r2 = solve([3, 4]);
if (!eq(r2.dist, [100, 0])) throw new Error(`[model] 2人局自检失败: ${r2.dist}`);
const r3 = solve([2, 3, 4]);
if (!eq(r3.dist, [99, 0, 1])) throw new Error(`[model] 3人局自检失败: ${r3.dist}`);
const r4 = solve([1, 2, 3, 4]);
if (!eq(r4.dist, [99, 0, 1, 0])) throw new Error(`[model] 4人局自检失败: ${r4.dist}`);
const r5 = solve([0, 1, 2, 3, 4]);
if (!eq(r5.dist, [98, 0, 1, 0, 1])) throw new Error(`[model] 5人局自检失败: ${r5.dist}`);
// “必须超过一半”变体：5人局提议者最多 97
const r5s = solve([0, 1, 2, 3, 4], true);
if (r5s.dist[0] !== 97) throw new Error(`[model] 变体自检失败: ${r5s.dist}`);

export const RESULTS = {r2, r3, r4, r5, r5s};

/** 某人在某轮的收买价文案，如 "0+1=1枚"；买不起显示 "要100枚" */
export function priceLabel(price: number | null): string {
  if (price === null) return '';
  if (price > TOTAL_COINS) return `要${price}枚（无法收买）`;
  return `${price - 1}+1=${price}枚`;
}

// ---- 配色语义 ----
export const C = {
  sky: '#FFE8C2', sun: '#FFC86B', island: '#F2C98F',
  sea: '#2B6E9E', deepSea: '#1F5580', wave: '#6FA8CE',
  deck: '#A8703B', deckLine: '#8B5A2B',
  paper: '#F6EAD0', ink: '#1B2540', muted: '#5E6672',
  coin: '#F2B632', coinHi: '#FFD66B', coinDark: '#D9951A',
  yes: '#2FA36B', no: '#D64545',
  bg: '#FFE8C2',
} as const;

export const PIRATE_COLORS = ['#6C4CD9', '#F58220', '#E85D9E', '#2F7BD9', '#14B8C4'] as const;
export const PIRATE_NAMES = ['A', 'B', 'C', 'D', 'E'] as const;
export const PIRATE_ROLES = ['船长', '大副', '舵手', '水手', '见习'] as const;
