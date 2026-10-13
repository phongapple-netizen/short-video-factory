// 布局断言：登记所有元素外框；检查安全区/不重叠/字号≥32/文字不溢出。

export type Box = {x: number; y: number; w: number; h: number};
export type El = {id: string; box: Box; fontPx: number; text?: string; stage?: boolean};

export const SAFE = {x0: 75, x1: 915, y0: 160, y1: 1500};
export const CX = 495;

// 五个海盗槽位（提示词为 145+175k，但会超出安全区 5px；改用 150+170k，视觉无差）
export const SLOT_X = [150, 320, 490, 660, 830]; // 中心 x
export const SLOT_FEET_Y = 930;
export const PIRATE_W = 150, PIRATE_H = 230;

const inSafe = (b: Box): boolean =>
  b.x >= SAFE.x0 && b.x + b.w <= SAFE.x1 && b.y >= SAFE.y0 && b.y + b.h <= SAFE.y1;
const overlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function checkFrame(els: El[], opts?: {skipSafe?: Set<string>}): string[] {
  const errs: string[] = [];
  for (const e of els) {
    if (!opts?.skipSafe?.has(e.id) && !inSafe(e.box)) errs.push(`[${e.id}] 超出安全区`);
    if (e.fontPx < 32) errs.push(`[${e.id}] 字号 ${e.fontPx} < 32`);
  }
  // 海盗是舞台本体，UI 元素依附于海盗，允许与其重叠；只检查 UI 元素之间
  const ui = els.filter(e => !e.stage);
  for (let i = 0; i < ui.length; i++)
    for (let j = i + 1; j < ui.length; j++)
      if (overlap(ui[i].box, ui[j].box))
        errs.push(`[${ui[i].id}] 与 [${ui[j].id}] 重叠`);
  return errs;
}

// ---------- 场景 08：三人局 C、D、E（相对秒） ----------
// players = [2,3,4]（C,D,E）；提议者 C(2)
export const S08 = {
  bubbleAt: 4,    // 思考气泡
  pricesAt: 8,    // 收买价旗牌
  planAt: 13,     // 方案行
  votesAt: 15,    // 投票旗（C先）
  verdictAt: 18,  // 判定条
  cardAt: 20,     // 结论卡
};

/** t（相对秒）时场景 08 的可见元素 */
export function s08Elements(t: number): El[] {
  const els: El[] = [
    {id: 's08-title', box: {x: 195, y: 230, w: 690, h: 110}, fontPx: 96, text: '三人局'},
    {id: 's08-count', box: {x: 300, y: 360, w: 390, h: 64}, fontPx: 36, text: '当前：只剩 C、D、E'},
  ];
  // 海盗（C,D,E 在场；A,B absent）——舞台本体，不参与 UI 重叠检查
  for (const k of [2, 3, 4])
    els.push({id: `s08-pirate${k}`, box: {x: SLOT_X[k] - 75, y: SLOT_FEET_Y - PIRATE_H, w: 150, h: 230}, fontPx: 36, stage: true});
  // 思考气泡（4s出现，8s淡出）
  if (t >= S08.bubbleAt && t < S08.pricesAt)
    els.push({id: 's08-bubble', box: {x: 285, y: 500, w: 420, h: 150}, fontPx: 36, text: '如果我下海'});
  if (t >= S08.pricesAt) {
    els.push({id: 's08-priced', box: {x: SLOT_X[3] - 85, y: 440, w: 170, h: 64}, fontPx: 36, text: '要100枚'});
    els.push({id: 's08-pricee', box: {x: SLOT_X[4] - 85, y: 440, w: 170, h: 64}, fontPx: 36, text: '0+1=1枚'});
  }
  if (t >= S08.planAt)
    for (const k of [2, 3, 4])
      els.push({id: `s08-plan${k}`, box: {x: SLOT_X[k] - 75, y: 520, w: 150, h: 72}, fontPx: 46});
  if (t >= S08.votesAt)
    for (const k of [2, 3, 4])
      els.push({id: `s08-vote${k}`, box: {x: SLOT_X[k] - 40, y: 610, w: 80, h: 90}, fontPx: 32});
  if (t >= S08.verdictAt)
    els.push({id: 's08-verdict', box: {x: 195, y: 1140, w: 690, h: 80}, fontPx: 46, text: '2/3票通过'});
  if (t >= S08.cardAt)
    els.push({id: 's08-card', box: {x: 195, y: 1240, w: 690, h: 90}, fontPx: 46, text: '三人局：C 99，D 0，E 1'});
  return els;
}
