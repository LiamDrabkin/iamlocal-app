#!/usr/bin/env python3
"""Import team photos into the app.

Reads scripts/photo-manifest.json (which source file plays which role), converts
each source image (JPEG/PNG/WEBP/HEIC) into a web-sized, metadata-stripped JPEG
under public/img/, and points data/seed.json at the results.

Roles
  venue  hero     cover photo, also the thumbnail in lists and on the map
         logo     the venue's insignia; shown as the venue avatar in the feed
         gallery  extra photos on the venue page
         post     image for a venue post (written to disk only; posts are authored in seed.json)
  person avatar   square crop used as the profile picture
         photos   the photo wall on the profile page
  site   welcome  opening photo on the Member Signup screen (file sits directly in the source folder)

Privacy: -strip removes EXIF, including GPS coordinates and device details.
Requires ImageMagick (`magick` or `convert`). Safe to re-run.

Usage: python3 scripts/import_photos.py [--src "../MOC data"]
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IM = shutil.which('magick') or shutil.which('convert')
MAX_EDGE = 1400   # px, long edge for hero / gallery / post / person photos
LOGO_EDGE = 240   # px, square logo tile
AVATAR_EDGE = 320 # px, square avatar
QUALITY = '82'


def run_convert(src: Path, dst: Path, *ops: str) -> None:
    """Run one ImageMagick conversion. `[0]` selects the first frame of animated/multi-image files."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [IM, f'{src}[0]', '-auto-orient', '-strip', '-background', 'white', '-alpha', 'remove', '-alpha', 'off',
           '-colorspace', 'sRGB', *ops, '-quality', QUALITY, str(dst)]
    subprocess.run(cmd, check=True, capture_output=True)


def photo(src: Path, dst: Path) -> None:
    run_convert(src, dst, '-resize', f'{MAX_EDGE}x{MAX_EDGE}>')


def logo(src: Path, dst: Path) -> None:
    run_convert(src, dst, '-resize', f'{LOGO_EDGE}x{LOGO_EDGE}', '-gravity', 'center', '-extent', f'{LOGO_EDGE}x{LOGO_EDGE}')


def avatar(src: Path, dst: Path, crop: str) -> None:
    run_convert(src, dst, '-crop', crop, '+repage', '-resize', f'{AVATAR_EDGE}x{AVATAR_EDGE}^', '-gravity', 'center', '-extent', f'{AVATAR_EDGE}x{AVATAR_EDGE}')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default=str(ROOT.parent / 'MOC data'), help='folder holding Places/ and Users/')
    args = ap.parse_args()
    if not IM:
        print('ImageMagick not found (need `magick` or `convert`).', file=sys.stderr)
        return 1

    src_root, out_root = Path(args.src), ROOT / 'public' / 'img'
    manifest = json.loads((ROOT / 'scripts' / 'photo-manifest.json').read_text())
    seed_path = ROOT / 'data' / 'seed.json'
    seed = json.loads(seed_path.read_text())
    venues = {v['id']: v for v in seed['venues']}
    people = {p['id']: p for p in seed['people']}

    for vid, m in manifest['venues'].items():
        base, folder = f"venues/{m['slug']}", src_root / m['src']
        photo(folder / m['hero'], out_root / f'{base}/hero.jpg')
        venues[vid]['img'] = f'{base}/hero'
        if m.get('logo'):
            logo(folder / m['logo'], out_root / f'{base}/logo.jpg')
            venues[vid]['logo'] = f'{base}/logo'
        venues[vid]['gallery'] = []
        for i, name in enumerate(m.get('gallery', []), 1):
            photo(folder / name, out_root / f'{base}/gallery-{i}.jpg')
            venues[vid]['gallery'].append(f'{base}/gallery-{i}')
        if m.get('post'):
            photo(folder / m['post'], out_root / f'{base}/post.jpg')
        print(f'venue {vid:>2} {m["slug"]}: hero{" logo" if m.get("logo") else ""} +{len(venues[vid]["gallery"])} gallery{" +post" if m.get("post") else ""}')

    for pid, m in manifest['people'].items():
        base, folder = f'people/{pid}', src_root / m['src']
        avatar(folder / m['avatar']['file'], out_root / f'{base}/avatar.jpg', m['avatar']['crop'])
        people[pid]['avatar'] = f'{base}/avatar'
        people[pid]['photos'] = []
        for i, name in enumerate(m['photos'], 1):
            photo(folder / name, out_root / f'{base}/photo-{i:02d}.jpg')
            people[pid]['photos'].append(f'{base}/photo-{i:02d}')
        print(f'person {pid}: avatar + {len(m["photos"])} photos')

    for name, filename in manifest.get('site', {}).items():
        photo(src_root / filename, out_root / f'site/{name}.jpg')
        print(f'site {name}: {filename}')

    seed_path.write_text(json.dumps(seed, indent=1, ensure_ascii=False) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
