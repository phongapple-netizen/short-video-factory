export type Voxel = {x: number; y: number; z: number};
export const key = ({x,y,z}: Voxel) => `${x},${y},${z}`;
export const ALL: Voxel[] = Array.from({length:125}, (_,i) => ({x:i%5,y:Math.floor(i/5)%5,z:Math.floor(i/25)}));
export const isCross = (a: number,b: number) => Math.abs(a-2)+Math.abs(b-2)<=1;
export const HOLES = [
  ALL.filter(({x,y}) => isCross(x,y)),
  ALL.filter(({y,z}) => isCross(y,z)),
  ALL.filter(({x,z}) => isCross(x,z)),
];
export const STAGES: Voxel[][] = [ALL];
export const REMOVED: Voxel[][] = [];
for (const hole of HOLES) {
  const holeKeys=new Set(hole.map(key));
  const previous=STAGES[STAGES.length-1];
  REMOVED.push(previous.filter(v=>holeKeys.has(key(v))));
  STAGES.push(previous.filter(v=>!holeKeys.has(key(v))));
}
export const LAYERS = [4,3,2,1,0].map(z=>STAGES[3].filter(v=>v.z===z));
const same=(got: number[],expected: number[])=>got.every((n,i)=>n===expected[i]);
if (!same(REMOVED.map(v=>v.length),[25,14,10]) || !same(STAGES.map(v=>v.length),[125,100,86,76]) || !same(LAYERS.map(v=>v.length),[20,16,4,16,20])) {
  throw new Error('The voxel model does not match the required drilling or layer counts.');
}
