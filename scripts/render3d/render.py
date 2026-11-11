"""Рендер: python render.py <сцена> [--w 1600 --h 1200 --samples 96] [--out путь] [--opt key=value]"""
import argparse, sys, time, os
sys.path.insert(0, os.path.dirname(__file__))
import lib, scenes

ap = argparse.ArgumentParser()
ap.add_argument('scene')
ap.add_argument('--w', type=int, default=1600)
ap.add_argument('--h', type=int, default=1200)
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--out', default=None)
ap.add_argument('--opt', action='append', default=[])
a = ap.parse_args()
t = time.time()
lib.reset()
cfg = getattr(scenes, a.scene.replace('-', '_'))(**dict(kv.split('=', 1) for kv in a.opt)) or {}
out = a.out or f'out/{a.scene}.png'
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
lib.render(os.path.abspath(out), a.w, a.h, a.samples, cfg.get('exposure', 0))
print(f'✓ {out} за {time.time() - t:.0f} с')
