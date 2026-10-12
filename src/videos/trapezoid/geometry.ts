export type Point={x:number;y:number};
export const SQRT2=Math.sqrt(2);
export const P={
  A:{x:-10,y:10}, B:{x:10,y:10}, C:{x:10*SQRT2,y:0}, D:{x:-10*SQRT2,y:0},
  O:{x:0,y:20-10*SQRT2}, H:{x:10*SQRT2,y:10},
  E:{x:-10,y:0}, M:{x:0,y:0}, N:{x:0,y:10},
} satisfies Record<string,Point>;
export const subtract=(a:Point,b:Point):Point=>({x:a.x-b.x,y:a.y-b.y});
export const dot=(a:Point,b:Point)=>a.x*b.x+a.y*b.y;
export const cross=(a:Point,b:Point)=>a.x*b.y-a.y*b.x;
export const length=(a:Point)=>Math.hypot(a.x,a.y);
export const distance=(a:Point,b:Point)=>length(subtract(a,b));
export const angle=(a:Point,o:Point,b:Point)=>Math.acos(Math.max(-1,Math.min(1,dot(subtract(a,o),subtract(b,o))/(distance(a,o)*distance(b,o)))))*180/Math.PI;
export const triangleArea=(a:Point,b:Point,c:Point)=>Math.abs(cross(subtract(b,a),subtract(c,a)))/2;
const near=(label:string,got:number,want:number)=>{
  if(!Number.isFinite(got)||Math.abs(got-want)>1e-8)throw new Error(`${label}: got ${got}, expected ${want}`);
};
export const GEOMETRY_AUDIT={
  angleAOB:angle(P.A,P.O,P.B), angleCAD:angle(P.C,P.A,P.D), angleCBD:angle(P.C,P.B,P.D),
  angleAOD:angle(P.A,P.O,P.D), angleADO:angle(P.A,P.D,P.O),
  angleOAB:angle(P.O,P.A,P.B), angleDAB:angle(P.D,P.A,P.B), angleADC:angle(P.A,P.D,P.C),
  AD:distance(P.A,P.D),BC:distance(P.B,P.C),AO:distance(P.A,P.O),BO:distance(P.B,P.O),
  AB:distance(P.A,P.B),CD:distance(P.C,P.D),height:P.A.y-P.D.y,areaABC:triangleArea(P.A,P.B,P.C),
  ACdotAD:dot(subtract(P.C,P.A),subtract(P.D,P.A)),BDdotBC:dot(subtract(P.D,P.B),subtract(P.C,P.B)),
  MA:distance(P.M,P.A),MB:distance(P.M,P.B),MC:distance(P.M,P.C),MD:distance(P.M,P.D),
  angleADB:angle(P.A,P.D,P.B),angleAMB:angle(P.A,P.M,P.B),
  MN:distance(P.M,P.N),AN:distance(P.A,P.N),BN:distance(P.B,P.N),
};
near('∠AOB',GEOMETRY_AUDIT.angleAOB,135);
near('∠CAD / AC⊥AD',GEOMETRY_AUDIT.angleCAD,90);
near('∠CBD / BD⊥BC',GEOMETRY_AUDIT.angleCBD,90);
near('AD=BC',GEOMETRY_AUDIT.AD,GEOMETRY_AUDIT.BC);
near('trapezoid height',GEOMETRY_AUDIT.height,10);
near('S△ABC',GEOMETRY_AUDIT.areaABC,100);
near('AB∥CD',cross(subtract(P.B,P.A),subtract(P.C,P.D)),0);
near('O lies on AC',cross(subtract(P.O,P.A),subtract(P.C,P.A)),0);
near('O lies on BD',cross(subtract(P.O,P.B),subtract(P.D,P.B)),0);
near('H lies on AB extension',P.H.y,P.A.y);
near('CH⊥AB',dot(subtract(P.C,P.H),subtract(P.B,P.A)),0);
near('AE=10',distance(P.A,P.E),10);
near('∠AOD',GEOMETRY_AUDIT.angleAOD,45);
near('∠ADO',GEOMETRY_AUDIT.angleADO,45);
near('AD=AO',GEOMETRY_AUDIT.AD,GEOMETRY_AUDIT.AO);
near('OA=OB',GEOMETRY_AUDIT.AO,GEOMETRY_AUDIT.BO);
near('∠OAB',GEOMETRY_AUDIT.angleOAB,22.5);
near('∠DAB',GEOMETRY_AUDIT.angleDAB,112.5);
near('∠ADC',GEOMETRY_AUDIT.angleADC,67.5);
near('M is the midpoint of CD / x',P.M.x,(P.C.x+P.D.x)/2);
near('M is the midpoint of CD / y',P.M.y,(P.C.y+P.D.y)/2);
near('MA=MC',GEOMETRY_AUDIT.MA,GEOMETRY_AUDIT.MC);
near('MB=MC',GEOMETRY_AUDIT.MB,GEOMETRY_AUDIT.MC);
near('MD=MC',GEOMETRY_AUDIT.MD,GEOMETRY_AUDIT.MC);
near('∠ADB',GEOMETRY_AUDIT.angleADB,45);
near('∠AMB / hidden right angle',GEOMETRY_AUDIT.angleAMB,90);
near('central angle = twice inscribed angle',GEOMETRY_AUDIT.angleAMB,2*GEOMETRY_AUDIT.angleADB);
near('MN⊥AB',dot(subtract(P.N,P.M),subtract(P.B,P.A)),0);
near('MN=AN',GEOMETRY_AUDIT.MN,GEOMETRY_AUDIT.AN);
near('MN=BN',GEOMETRY_AUDIT.MN,GEOMETRY_AUDIT.BN);
near('MN=AB/2',GEOMETRY_AUDIT.MN,GEOMETRY_AUDIT.AB/2);
if(!(GEOMETRY_AUDIT.AB<GEOMETRY_AUDIT.CD&&P.A.y>P.C.y))throw new Error('AB must be the upper short base.');
