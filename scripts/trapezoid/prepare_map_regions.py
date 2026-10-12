"""Pre-render feathered later-period regions from the map JSON, once."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
root = Path(__file__).resolve().parents[2]
config = json.loads((root / 'src/videos/trapezoid/history/map/world.json').read_text())
image = Image.new('RGBA', (config['width'], config['height']))
draw = ImageDraw.Draw(image)
for region in config['laterRegions']:
    draw.polygon([tuple(p) for p in region['points']], fill=region['color'])
target = root / 'public/assets/chibi/map/regions.png'
target.parent.mkdir(parents=True, exist_ok=True)
image.filter(ImageFilter.GaussianBlur(12)).save(target)
print(target)
