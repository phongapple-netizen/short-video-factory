"""Prepare the SVG world's parchment image once, never during frame rendering."""
import json,math,random
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
config=json.loads((root/'src/videos/trapezoid/history/map/world.json').read_text())
target=root/'public/assets/chibi/map/base.png'
if target.exists():
 print('Reusing existing public/assets/chibi/map/base.png')
 raise SystemExit
rng=random.Random(208)
w,h=config['width'],config['height']
im=Image.new('RGB',(w,h),(239,227,200));pixels=im.load()
for y in range(h):
 for x in range(w):
  grain=rng.randint(-4,4)
  cloud=2*math.sin(x/140)+2*math.sin(y/190)
  pixels[x,y]=tuple(max(0,min(255,round(c+grain+cloud))) for c in (239,227,200))
layer=Image.new('RGBA',(w,h),(0,0,0,0));draw=ImageDraw.Draw(layer)
for i in range(47):
 x=rng.randrange(60,w-100);y=rng.randrange(70,h-80)
 for j in range(rng.randrange(2,5)):
  coords=[(x-50+j*12,y+34),(x-20+j*8,y-9-j*9),(x+j*9,y-36-j*8),(x+24+j*8,y-8-j*7),(x+56+j*11,y+31)]
  draw.line(coords,fill=(109,101,78,25),width=2)
for i in range(2000):
 x=rng.randrange(w);y=rng.randrange(h)
 draw.line([(x,y),(x+rng.randrange(1,5),y+rng.randrange(1,3))],fill=(109,87,49,12),width=1)
im=Image.alpha_composite(im.convert('RGBA'),layer)
def curve(points):
 out=[]
 for i in range(len(points)-1):
  p0=points[max(0,i-1)];p1=points[i];p2=points[i+1];p3=points[min(len(points)-1,i+2)]
  for j in range(30):
   t=j/30
   out.append(tuple(.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t) for k in (0,1)))
 out.append(tuple(points[-1]));return out
river=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(river)
d.line(curve(config['yangtze']),fill=(107,143,163,30),width=config['riverWashWidth'])
d.line(curve(config['yangtze']),fill=(107,143,163,125),width=config['riverWidth'])
d.line(curve(config['han']),fill=(107,143,163,76),width=9)
im=Image.alpha_composite(im,river).convert('RGB')
im.save(target,optimize=True)
print('Pre-rendered map base:',target,'bytes:',target.stat().st_size)
