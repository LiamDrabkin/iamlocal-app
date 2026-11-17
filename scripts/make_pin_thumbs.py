#!/usr/bin/env python3
"""Make a small square thumbnail of every venue's cover photo for the map pins.

Pins show a 40-56px circle, so decoding a 1400px photo per pin wastes memory and slows panning,
especially on phones. This writes `<stem>-pin.jpg` (160x160, centre crop, EXIF stripped) next to each
venue's cover photo, and the app loads it through `pinImg()` in lib/types.ts. Venues with a logo use the
logo instead. Safe to re-run: it only rewrites a thumbnail when the source is newer.
Run from the project root:  python3 scripts/make_pin_thumbs.py
"""
import json, os, subprocess, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
img_dir = os.path.join(root, 'public', 'img')
tool = 'magick' if subprocess.run(['which', 'magick'], capture_output=True).returncode == 0 else 'convert'
seed = json.load(open(os.path.join(root, 'data', 'seed.json')))
made = skipped = 0
for v in seed['venues']:
    src = os.path.join(img_dir, v['img'] + '.jpg')
    dst = os.path.join(img_dir, v['img'] + '-pin.jpg')
    if not os.path.exists(src):
        print('missing source', v['id'], src); continue
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        skipped += 1; continue
    subprocess.run([tool, src, '-auto-orient', '-resize', '160x160^', '-gravity', 'center', '-extent', '160x160', '-strip', '-quality', '82', dst], check=True)
    made += 1
print(f'pin thumbnails: {made} made, {skipped} up to date')
