#!/usr/bin/env python3
"""
Classical batch upscaler for the Chikwafu product photos.

Real-ESRGAN (the originally requested tool) cannot run in this sandbox: the
67 MB pretrained weights are unreachable (every model CDN is blocked) and the
box has no GPU and 2 CPU cores (~1-2 min per image). This script provides the
fallback the owner approved: high-quality Lanczos resampling + a mild unsharp
pass, which cleans up the blocky edges of the heavily-compressed source webps
without inventing detail.

Usage (from repo root):
    python3 scripts/upscale_images.py                     # 2x, q80, public/ -> upscaled/
    python3 scripts/upscale_images.py --scale 4 --quality 85
    python3 scripts/upscale_images.py --limit 50          # first 50 only (sample run)

Resumable: existing outputs newer than their source are skipped, so an
interrupted background run continues where it stopped. Alpha channels are
preserved; sharpening is applied to colour channels only (no alpha halos).

One-time setup (any venv or --user install works):
    python3 -m venv /tmp/v2 && /tmp/v2/bin/pip install opencv-python-headless numpy
    /tmp/v2/bin/python scripts/upscale_images.py
"""
import argparse
import sys
import time
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
EXTS = {'.webp', '.png', '.jpg', '.jpeg'}


def unsharp(img: np.ndarray, amount: float = 0.3, sigma: float = 1.0) -> np.ndarray:
    """Mild unsharp mask; touches only colour channels so alpha stays clean."""
    if img.ndim == 3 and img.shape[2] == 4:
        bgr = img[:, :, :3]
        blurred = cv2.GaussianBlur(bgr, (0, 0), sigma)
        sharp = cv2.addWeighted(bgr, 1.0 + amount, blurred, -amount, 0)
        out = img.copy()
        out[:, :, :3] = sharp
        return out
    blurred = cv2.GaussianBlur(img, (0, 0), sigma)
    return cv2.addWeighted(img, 1.0 + amount, blurred, -amount, 0)


def upscale_one(src: Path, dst: Path, scale: int, quality: int) -> int:
    img = cv2.imread(str(src), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f'unreadable image: {src}')
    h, w = img.shape[:2]
    big = cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
    big = unsharp(big)
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.suffix.lower() in ('.webp',):
        ok = cv2.imwrite(str(dst), big, [cv2.IMWRITE_WEBP_QUALITY, quality])
    elif dst.suffix.lower() == '.png':
        ok = cv2.imwrite(str(dst), big, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    else:
        ok = cv2.imwrite(str(dst), big, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError(f'encode failed: {dst}')
    return dst.stat().st_size


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--src', default=str(ROOT / 'public'))
    ap.add_argument('--out', default=str(ROOT / 'upscaled'))
    ap.add_argument('--scale', type=int, default=2, choices=[2, 3, 4])
    ap.add_argument('--quality', type=int, default=80)
    ap.add_argument('--limit', type=int, default=0, help='stop after N files (0 = all)')
    args = ap.parse_args()

    src, out = Path(args.src), Path(args.out)
    files = sorted(p for p in src.rglob('*') if p.suffix.lower() in EXTS and p.is_file())
    print(f'[upscale] {len(files)} raster images under {src} -> {out} (x{args.scale}, q{args.quality})', flush=True)

    done = skipped = failed = 0
    bytes_out = 0
    t0 = time.time()
    for i, p in enumerate(files, 1):
        rel = p.relative_to(src)
        dst = out / rel
        if dst.exists() and dst.stat().st_size > 0 and dst.stat().st_mtime >= p.stat().st_mtime:
            skipped += 1
            continue
        try:
            bytes_out += upscale_one(p, dst, args.scale, args.quality)
            done += 1
        except Exception as err:  # keep the batch running; report at the end
            failed += 1
            print(f'[upscale] FAIL {rel}: {err}', flush=True)
        if done % 100 == 0:
            rate = done / max(time.time() - t0, 1e-6)
            eta = (len(files) - i) / rate if rate > 0 else 0
            print(f'[upscale] {i}/{len(files)} processed={done} skipped={skipped} failed={failed} '
                  f'{rate:.1f} img/s eta={eta/60:.1f}min out={bytes_out/1e6:.0f}MB', flush=True)
        if args.limit and done >= args.limit:
            print('[upscale] limit reached', flush=True)
            break

    print(f'[upscale] DONE processed={done} skipped={skipped} failed={failed} '
          f'time={(time.time()-t0)/60:.1f}min out={bytes_out/1e6:.0f}MB', flush=True)
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
