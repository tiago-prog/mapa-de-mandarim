from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/mapa-de-mandarim-logo.png')
targets = [
    (Path('/home/ubuntu/mapa-mandarim/assets/images/icon.png'), 512),
    (Path('/home/ubuntu/mapa-mandarim/assets/images/splash-icon.png'), 512),
    (Path('/home/ubuntu/mapa-mandarim/assets/images/favicon.png'), 256),
    (Path('/home/ubuntu/mapa-mandarim/assets/images/android-icon-foreground.png'), 512),
]

image = Image.open(source).convert('RGBA')
for target, size in targets:
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(target, format='PNG', optimize=True)
