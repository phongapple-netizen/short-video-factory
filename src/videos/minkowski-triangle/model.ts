// 数据自检：闵可夫斯基不等式的“拼三角形”证明。
// √(a²+b²) + √(c²+d²) ≥ √((a+c)²+(b+d)²)，a、b、c、d > 0。
// 两个直角三角形（直角边 a,b 与 c,d）首尾相接，两条斜边是折线，大三角形的斜边是直线。
// 画面上所有点都由 layout() 算出；断言失败直接报错。

export type Pt = {x: number; y: number};
export type Tri = {right: Pt; top: Pt; foot: Pt}; // 直角顶点、竖直边上端、水平边右端

export const SIDES = {a: 4, b: 3, c: 2, d: 4} as const;
export const UNIT = 80; // 每单位长度的白板像素

/** 拼好后的位置：corner 为大三角形直角顶点（白板坐标，y 向下） */
export function joined(a: number, b: number, c: number, d: number, corner: Pt, u = UNIT) {
  const blue: Tri = {right: {x: corner.x, y: corner.y - c * u}, top: {x: corner.x, y: corner.y - (a + c) * u},
    foot: {x: corner.x + b * u, y: corner.y - c * u}};
  const red: Tri = {right: {x: corner.x + b * u, y: corner.y}, top: blue.foot, foot: {x: corner.x + (b + d) * u, y: corner.y}};
  return {blue, red, apex: blue.top, kink: blue.foot, end: red.foot, corner};
}

/** 拼之前：两个三角形并排，直角顶点分别在 blueAt、redAt */
export function apart(a: number, b: number, c: number, d: number, blueAt: Pt, redAt: Pt, u = UNIT) {
  const tri = (r: Pt, v: number, h: number): Tri => ({right: r, top: {x: r.x, y: r.y - v * u}, foot: {x: r.x + h * u, y: r.y}});
  return {blue: tri(blueAt, a, b), red: tri(redAt, c, d)};
}

export const len = (p: Pt, q: Pt) => Math.hypot(q.x - p.x, q.y - p.y);
export const lerp = (p: Pt, q: Pt, t: number): Pt => ({x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t});

/** 取等号时 d 的值：a∶b = c∶d */
export const EQUAL_D = (SIDES.c * SIDES.b) / SIDES.a;

// ---- 自检 ----
{
  const {a, b, c, d} = SIDES;
  const J = joined(a, b, c, d, {x: 0, y: 0}, 1);
  const lhs = Math.hypot(a, b) + Math.hypot(c, d), rhs = Math.hypot(a + c, b + d);
  if (Math.abs(len(J.apex, J.kink) - Math.hypot(a, b)) > 1e-9) throw new Error('[model] 蓝斜边长度不对');
  if (Math.abs(len(J.kink, J.end) - Math.hypot(c, d)) > 1e-9) throw new Error('[model] 红斜边长度不对');
  if (Math.abs(len(J.apex, J.end) - rhs) > 1e-9) throw new Error('[model] 绿斜边长度不对');
  if (!(lhs > rhs)) throw new Error('[model] 不等式方向错误');
  if (a / b === c / d) throw new Error('[model] 示例参数应取不等的比例，才能看出折线');
  const E = joined(a, b, c, EQUAL_D, {x: 0, y: 0}, 1);
  if (Math.abs(len(E.apex, E.kink) + len(E.kink, E.end) - len(E.apex, E.end)) > 1e-9) throw new Error('[model] 比例相等时应取等号');
}
