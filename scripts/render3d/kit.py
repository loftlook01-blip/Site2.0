"""
Параметрический генератор кухонных сцен (Blender / Cycles).
Кухня собирается из модулей так же, как на производстве: цоколь → корпус → фасады → столешница → верх.
Единицы — метры. Комната: X от -W/2 до W/2, Y от 0 (камера) до D (задняя стена), Z вверх.
"""
import math, os, random
import bpy
import lib
from lib import box, cyl, sphere, mat, srgb

A = os.environ.get('R3D_ASSETS', 'assets')
_img, _mats = {}, {}


def img(path, color=True):
    key = (path, color)
    if key not in _img:
        im = bpy.data.images.load(path, check_existing=True)
        im.colorspace_settings.name = 'sRGB' if color else 'Non-Color'
        _img[key] = im
    return _img[key]


def tex(name, asset, size_m, tint=None, tint_mix=1.0, sat=1.0, val=1.0, rough_add=0.0, rough_mul=1.0, bump=0.25, rot=(0, 0, 0), coat=0.0, metal=0.0):
    """Фототекстура Poly Haven с кубической проекцией — UV-развёртки не нужны."""
    key = (name,)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n, l, b = nt.nodes, nt.links, nt.nodes['Principled BSDF']
    tc, mp = n.new('ShaderNodeTexCoord'), n.new('ShaderNodeMapping')
    s = 1.0 / size_m
    mp.inputs['Scale'].default_value = (s, s, s)
    mp.inputs['Rotation'].default_value = tuple(math.radians(a) for a in rot)
    l.new(tc.outputs['Object'], mp.inputs['Vector'])
    folder = os.path.join(A, 'tex', asset)

    def tx(fn, color):
        t = n.new('ShaderNodeTexImage')
        t.image = img(os.path.join(folder, fn), color)
        t.projection = 'BOX'
        t.projection_blend = 0.15
        l.new(mp.outputs['Vector'], t.inputs['Vector'])
        return t

    diff = 'diff.jpg' if os.path.exists(os.path.join(folder, 'diff.jpg')) else 'diff.png'
    col = tx(diff, True).outputs['Color']
    hsv = n.new('ShaderNodeHueSaturation')
    hsv.inputs['Saturation'].default_value = sat
    hsv.inputs['Value'].default_value = val
    l.new(col, hsv.inputs['Color'])
    col = hsv.outputs['Color']
    if tint:
        mix = n.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = tint_mix
        l.new(col, mix.inputs['A'])
        mix.inputs['B'].default_value = (*srgb(tint), 1)
        col = mix.outputs['Result']
    l.new(col, b.inputs['Base Color'])
    rfile = next((f for f in ('rough.jpg', 'rough.png') if os.path.exists(os.path.join(folder, f))), None)
    if rfile:
        r = tx(rfile, False)
        mm = n.new('ShaderNodeMath')
        mm.operation = 'MULTIPLY_ADD'
        mm.use_clamp = True
        mm.inputs[1].default_value = rough_mul
        mm.inputs[2].default_value = rough_add
        l.new(r.outputs['Color'], mm.inputs[0])
        l.new(mm.outputs[0], b.inputs['Roughness'])
    nfile = next((f for f in ('nor.jpg', 'nor.png') if os.path.exists(os.path.join(folder, f))), None)
    if nfile and bump:
        nm = n.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = bump * 2
        l.new(tx(nfile, False).outputs['Color'], nm.inputs['Color'])
        l.new(nm.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Metallic'].default_value = metal
    _mats[key] = m
    return m


def paint(name, hexc, rough=0.55, coat=0.0):
    """Матовая эмаль / плёнка soft-touch: едва заметная неровность, чтобы блики были живыми."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n, l, b = nt.nodes, nt.links, nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(hexc), 1)
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.2
    tc, nz = n.new('ShaderNodeTexCoord'), n.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 9
    nz.inputs['Detail'].default_value = 4
    l.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = rough - 0.06
    mr.inputs['To Max'].default_value = rough + 0.06
    l.new(nz.outputs['Fac'], mr.inputs['Value'])
    l.new(mr.outputs['Result'], b.inputs['Roughness'])
    _mats[name] = m
    return m


def M(key):
    """Библиотека материалов. Имена — как в смете."""
    lib_ = {
        # фасады
        'graphite': lambda: paint('f_graphite', '#2b2d2f', 0.5),
        'black': lambda: paint('f_black', '#161718', 0.48),
        'white': lambda: paint('f_white', '#ece8e0', 0.5),
        'greige': lambda: paint('f_greige', '#b3a999', 0.5),
        'sage': lambda: paint('f_sage', '#7d8a72', 0.5),
        'navy': lambda: paint('f_navy', '#243245', 0.48),
        'terracotta': lambda: paint('f_terracotta', '#9c573c', 0.5),
        'cream': lambda: paint('f_cream', '#ddd3c2', 0.5),
        'oak': lambda: tex('f_oak', 'oak_veneer_01', 1.2, val=1.05, sat=0.9, rot=(0, 90, 0), rough_add=0.1, bump=0.15),
        'white_oak': lambda: tex('f_white_oak', 'white_oak_veneer', 1.2, val=1.1, sat=0.85, rot=(0, 90, 0), rough_add=0.1, bump=0.15),
        'walnut': lambda: tex('f_walnut', 'walnut_veneer', 1.2, rot=(0, 90, 0), rough_add=0.1, bump=0.15),
        'black_oak': lambda: tex('f_black_oak', 'black_oak_veneer', 1.2, val=0.9, rot=(0, 90, 0), rough_add=0.1, bump=0.2),
        'grey_oak': lambda: tex('f_grey_oak', 'grey_oak_veneer_01', 1.2, rot=(0, 90, 0), rough_add=0.1, bump=0.15),
        # столешницы
        'marble': lambda: tex('t_marble', 'marble_01', 1.6, val=1.05, sat=0.4, rough_mul=0.5, rough_add=0.12, bump=0.02, coat=0.3),
        'quartz_white': lambda: paint('t_quartz_white', '#e9e5dd', 0.28, coat=0.3),
        'quartz_grey': lambda: tex('t_quartz_grey', 'terrazzo_tiles', 1.2, sat=0.2, val=0.75, rough_mul=0.4, rough_add=0.18, bump=0.0, coat=0.2),
        'compact_black': lambda: paint('t_compact', '#1b1c1c', 0.32),
        'top_oak': lambda: tex('t_oak', 'oak_veneer_01', 1.6, val=0.95, sat=1.0, rough_mul=0.7, rough_add=0.08, bump=0.1, coat=0.2),
        'granite': lambda: tex('t_granite', 'granite_tile_02', 1.4, val=0.55, sat=0.3, rough_mul=0.5, rough_add=0.1, bump=0.0, coat=0.3),
        # отделка
        'floor_oak': lambda: tex('fl_oak', 'laminate_floor_02', 2.2, val=1.05, sat=0.85, rough_mul=0.8, rough_add=0.05, bump=0.2, coat=0.15),
        'floor_herring': lambda: tex('fl_herring', 'herringbone_parquet', 1.3, val=1.05, sat=0.75, rough_mul=1.0, rough_add=0.22, bump=0.2),
        'floor_tile': lambda: lib.mat_noise('fl_tile', '#c4beb2', '#b7b1a4', scale=2.2, rough=0.38, bump=0.01),
        'wall_plaster': lambda: lib.mat_noise('w_plaster', '#ebe6dc', '#e6e0d5', scale=3, rough=0.88, bump=0.012),
        'wall_warm': lambda: lib.mat_noise('w_warm', '#ddd3c3', '#d6cbb9', scale=3, rough=0.88, bump=0.012),
        'wall_white': lambda: lib.mat_noise('w_white', '#f1eee8', '#ece8e1', scale=3, rough=0.88, bump=0.01),
        'wall_dark': lambda: lib.mat_noise('w_dark', '#4c4d49', '#454642', scale=3, rough=0.85, bump=0.02),
        'wall_sage': lambda: lib.mat_noise('w_sage', '#aab09c', '#a3a994', scale=3, rough=0.88, bump=0.012),
        'wall_tile': lambda: tex('w_tile', 'terrazzo_tiles', 1.2, sat=0.25, val=1.15, rough_mul=0.6, bump=0.15),
        'concrete': lambda: lib.mat_noise('concrete', '#8c8983', '#9d9a93', scale=1.5, rough=0.6, bump=0.04),
        'ldsp_white': lambda: mat('ldsp_white', '#e8e5df', rough=0.55),
        'linen': lambda: tex('linen', 'rough_linen', 0.5, tint='#d9cfbf', sat=0.5, val=1.1, bump=0.4),
        'plywood': lambda: tex('plywood', 'plywood', 1.2, val=1.1, bump=0.1),
        # металл, стекло, техника
        'steel': lambda: mat('steel', '#b9b6ae', rough=0.28, metal=1.0),
        'brass': lambda: mat('brass', '#b08a4e', rough=0.3, metal=1.0),
        'blackmetal': lambda: mat('blackmetal', '#131313', rough=0.38, metal=0.9),
        'glass_black': lambda: mat('glass_black', '#0a0a0a', rough=0.34, coat=0.25),
        'carcass': lambda: mat('carcass', '#1a1a19', rough=0.7),
        'ceramic_w': lambda: mat('ceramic_w', '#efeae0', rough=0.25, coat=0.4),
        'ceramic_d': lambda: mat('ceramic_d', '#2a2826', rough=0.35),
        'ceramic_t': lambda: mat('ceramic_t', '#a9643f', rough=0.5),
        'mirror': lambda: mat('mirror', '#f4f4f4', rough=0.02, metal=1.0),
        'brick': lambda: lib.mat_brick(),
    }
    if key not in _mats:
        _mats[key] = lib_[key]()
    return _mats[key]


# ───────────────────────── Ряд модулей ─────────────────────────

FT = 0.019   # толщина фасада
GAP = 0.003  # зазор между фасадами
PL = 0.10    # цоколь
BH = 0.76    # высота корпуса низа
TOP_T = 0.03
CT = PL + BH  # низ столешницы (0.86)


class Run:
    """Ряд шкафов вдоль стены. orient: 'back' — вдоль X лицом к камере, 'right'/'left' — вдоль Y лицом в комнату,
    'free' — остров (лицом к камере), wall — координата стены (или задней плоскости острова)."""

    def __init__(self, orient, start, wall, cfg):
        self.o, self.s, self.w, self.c = orient, start, wall, cfg
        self.u = 0.0

    def P(self, u, d, z, su, sd, sz):
        """Локальные (вдоль ряда, от стены, высота) → мировые размеры и позиция центра нижней грани."""
        if self.o in ('back', 'free'):
            return (su, sd, sz), (self.s + u, self.w - d, z)
        if self.o == 'right':
            return (sd, su, sz), (self.w - d, self.s - u, z)
        return (sd, su, sz), (self.w + d, self.s - u, z)  # left

    def b(self, name, u, d, z, su, sd, sz, m, bevel=0.0):
        size, loc = self.P(u, d, z, su, sd, sz)
        return box(name, size, loc, m, bevel)

    # — фасад с ручкой —
    def front(self, u0, w, z0, h, depth, m=None, handle=True, vertical=False, hz='top'):
        c = self.c
        m = m or c['front']
        uc = u0 + w / 2
        self.b('front', uc, depth + FT / 2, z0, w - GAP, FT, h - GAP, m, bevel=0.0012)
        if c.get('frame') and w > 0.2 and h > 0.2:  # рамка «шейкер»
            fw, ft = 0.065, 0.006
            d = depth + FT + ft / 2
            for (du, dz, su, sz) in ((0, 0, w - GAP, fw), (0, h - GAP - fw, w - GAP, fw)):
                self.b('rail', uc + du, d, z0 + dz, su, ft, sz, m, bevel=0.001)
            for du in (-(w - GAP) / 2 + fw / 2, (w - GAP) / 2 - fw / 2):
                self.b('stile', uc + du, d, z0 + fw, fw, ft, h - GAP - 2 * fw, m, bevel=0.001)
        hd = c.get('handle', 'bar')
        if not handle or hd in ('gola', 'none'):
            return
        hm = c.get('handle_m') or M('blackmetal')
        d = depth + FT + (0.006 if c.get('frame') else 0) + 0.012
        if hd == 'knob':
            size, loc = self.P(uc if not vertical else u0 + (0.05 if vertical == 'l' else w - 0.05), d, (z0 + h - 0.06) if hz == 'top' else z0 + 0.06, 0, 0, 0)
            cyl('knob', 0.014, 0.022, (loc[0], loc[1], loc[2]), hm, verts=24, rot=(math.radians(90), 0, 0) if self.o in ('back', 'free') else (0, math.radians(90), 0))
            return
        L = min(0.22, w * 0.5)
        if vertical:
            uu = u0 + 0.045 if vertical == 'l' else u0 + w - 0.045
            zz = z0 + h - 0.08 - L if hz == 'top' else z0 + 0.08
            if hz == 'mid':
                zz = z0 + h / 2 - L / 2
            self.b('handle', uu, d, zz, 0.012, 0.012, L, hm, bevel=0.002)
        else:
            zz = z0 + h - 0.05 if hz == 'top' else z0 + 0.04
            self.b('handle', uc, d, zz, L, 0.012, 0.012, hm, bevel=0.002)

    # — нижние модули —
    def base(self, w, kind='drawers3', m=None, top=True):
        c, u0 = self.c, self.u
        depth = c.get('base_depth', 0.56)
        gola = c.get('handle') == 'gola'
        self.b('plinth', u0 + w / 2, (depth - 0.05) / 2, 0, w, depth - 0.05, PL, M('carcass'))
        self.b('carcass', u0 + w / 2, depth / 2, PL, w, depth - 0.002, BH, m or c['front'])
        z0, H = PL, BH
        if gola:  # профиль Gola: тёмная выемка под столешницей
            H -= 0.032
            self.b('gola', u0 + w / 2, depth - 0.004, PL + H, w, 0.012, 0.032, M('carcass'))
        if kind == 'drawers3':
            hs = [H * 0.2, H * 0.4, H * 0.4]
            z = z0 + H
            for i, h in enumerate(hs):
                z -= h
                self.front(u0, w, z, h, depth, m)
        elif kind == 'drawers2':
            for i in range(2):
                self.front(u0, w, z0 + i * H / 2, H / 2, depth, m)
        elif kind == 'door':
            self.front(u0, w, z0, H, depth, m, vertical='r')
        elif kind == 'door_l':
            self.front(u0, w, z0, H, depth, m, vertical='l')
        elif kind == 'doors2':
            self.front(u0, w / 2, z0, H, depth, m, vertical='r')
            self.front(u0 + w / 2, w / 2, z0, H, depth, m, vertical='l')
        elif kind == 'dishwasher':
            self.front(u0, w, z0, H, depth, m)
        elif kind == 'oven':
            self.front(u0, w, z0, 0.14, depth, m, handle=False)
            self.b('oven', u0 + w / 2, depth + 0.01, z0 + 0.145, w - 0.008, 0.02, H - 0.15, M('glass_black'), bevel=0.002)
            self.b('oven_h', u0 + w / 2, depth + 0.045, z0 + H - 0.09, w - 0.14, 0.014, 0.014, M('steel'), bevel=0.003)
        elif kind == 'panel':
            self.front(u0, w, z0, H, depth, m, handle=False)
        self.u += w

    def top(self, u0, u1, m=None, over=0.02, t=TOP_T, side_over=0.0, depth=None):
        d = (depth or self.c.get('base_depth', 0.56)) + FT + over
        self.b('counter', (u0 + u1) / 2, d / 2, CT, u1 - u0 + side_over * 2, d, t, m or self.c['top'], bevel=0.002)

    def splash(self, u0, u1, z1=1.5, m=None):
        self.b('splash', (u0 + u1) / 2, 0.006, CT + TOP_T, u1 - u0, 0.012, z1 - CT - TOP_T, m or self.c.get('splash') or self.c['top'])

    def sink(self, u, w=0.5):
        d = 0.30
        self.b('sink', u, d, CT + TOP_T - 0.004, w, 0.40, 0.005, M('glass_black'))
        self.b('sink_rim', u, d, CT + TOP_T, w + 0.02, 0.42, 0.002, M('steel'), bevel=0.001)
        size, loc = self.P(u, 0.09, CT + TOP_T, 0, 0, 0)
        hm = self.c.get('tap_m') or M('steel')
        cyl('tap', 0.012, 0.30, loc, hm, verts=24)
        self.b('tap_spout', u, 0.09 + 0.09, CT + TOP_T + 0.29, 0.02, 0.2, 0.02, hm, bevel=0.004)

    def hob(self, u, w=0.58):
        self.b('hob', u, 0.31, CT + TOP_T, w, 0.50, 0.005, M('glass_black'), bevel=0.001)

    # — верхние шкафы —
    def wall(self, u0, widths, z0=1.5, h=0.72, depth=0.33, m=None, light=True):
        c, u = self.c, u0
        for w in widths:
            self.b('wcarcass', u + w / 2, depth / 2, z0, w, depth - 0.002, h, m or c['front'])
            self.front(u, w, z0, h, depth, m, vertical='r' if c.get('handle') != 'gola' else False, hz='bottom', handle=c.get('wall_handles', c.get('handle') not in ('gola',)))
            u += w
        if light:  # светодиодный профиль под шкафами
            L = u - u0
            size, loc = self.P(u0 + L / 2, depth - 0.06, z0 - 0.004, L - 0.06, 0.012, 0.004)
            box('led', size, loc, lib.mat_emit('led', '#ffe7c4', 14))
            size, loc = self.P(u0 + L / 2, depth / 2 + 0.02, z0 - 0.02, 0, 0, 0)
            rotd = {'back': (0, 0, 0), 'free': (0, 0, 0), 'right': (0, 0, 90), 'left': (0, 0, 90)}[self.o]
            lib.area(loc, rotd, L * 0.9, 9 * L, '#ffe2bd', size_y=0.1)

    def ceil_row(self, u0, widths, z0, H, depth=0.33, m=None):
        u = u0
        for w in widths:
            self.b('acarcass', u + w / 2, depth / 2, z0, w, depth - 0.002, H - z0 - 0.012, m or self.c['front'])
            self.front(u, w, z0, H - z0 - 0.012, depth, m, handle=False)
            u += w

    # — колонны —
    def tall(self, w, kind='fridge', top=2.22, m=None):
        c, u0 = self.c, self.u
        depth = 0.58
        self.b('plinth', u0 + w / 2, (depth - 0.05) / 2, 0, w, depth - 0.05, PL, M('carcass'))
        self.b('tcarcass', u0 + w / 2, depth / 2, PL, w, depth - 0.002, top - PL, m or c['front'])
        if kind == 'fridge':
            self.front(u0, w, PL, 0.72, depth, m, vertical='r', hz='top')
            self.front(u0, w, PL + 0.72, top - PL - 0.72, depth, m, vertical='r', hz='bottom')
        elif kind == 'oven':
            self.front(u0, w, PL, 0.60, depth, m)
            self.b('oven', u0 + w / 2, depth + 0.01, PL + 0.605, w - 0.008, 0.02, 0.59, M('glass_black'), bevel=0.002)
            self.b('oven_h', u0 + w / 2, depth + 0.045, PL + 1.13, w - 0.14, 0.014, 0.014, M('steel'), bevel=0.003)
            self.b('mw', u0 + w / 2, depth + 0.01, PL + 1.2, w - 0.008, 0.02, 0.37, M('glass_black'), bevel=0.002)
            self.front(u0, w, PL + 1.575, top - PL - 1.575, depth, m, vertical='r', hz='bottom')
        elif kind == 'door':
            self.front(u0, w, PL, top - PL, depth, m, vertical='r', hz='mid')
        self.u += w

    def shelves(self, u0, u1, zs=(1.52, 1.92), m=None, depth=0.24, props=True, seed=1):
        m = m or M('oak')
        rnd = random.Random(seed)
        cer = [M('ceramic_w'), M('ceramic_d'), M('ceramic_t')]
        for z in zs:
            self.b('shelf', (u0 + u1) / 2, depth / 2, z, u1 - u0, depth, 0.035, m, bevel=0.002)
            if not props:
                continue
            u = u0 + 0.12
            while u < u1 - 0.1:
                size, loc = self.P(u, depth / 2, z + 0.035, 0, 0, 0)
                r = 0.04 + rnd.random() * 0.035
                k = rnd.random()
                if k < 0.6:
                    cyl('jar', r, 0.08 + rnd.random() * 0.14, loc, rnd.choice(cer), verts=32, bevel=0.004)
                else:
                    for j in range(3):
                        cyl('plate', 0.1, 0.012, (loc[0], loc[1], loc[2] + j * 0.014), M('ceramic_w'), verts=40, bevel=0.003)
                u += 0.2 + rnd.random() * 0.22


# ───────────────────────── Декор ─────────────────────────

def boards(x, y, z, along='x'):
    """Разделочные доски у стены"""
    for i, (w, h, m) in enumerate(((0.26, 0.38, 'top_oak'), (0.2, 0.3, 'walnut'))):
        rot = (math.radians(-8), 0, 0) if along == 'x' else (0, math.radians(8), 0)
        size = (w, 0.02, h) if along == 'x' else (0.02, w, h)
        loc = (x + i * 0.16, y - i * 0.022, z) if along == 'x' else (x - i * 0.022, y + i * 0.16, z)
        box('board', size, loc, M(m), bevel=0.004, rot=rot)


def bowl(x, y, z, fruit='#d9a12b', n=5):
    cyl('bowl', 0.15, 0.07, (x, y, z), M('ceramic_w'), verts=48, r2=0.09 if False else None, bevel=0.01)
    rnd = random.Random(int(x * 100))
    fm = mat('fruit' + fruit, fruit, rough=0.45)
    for i in range(n):
        a = i / n * math.tau
        sphere('fruit', 0.04, (x + math.cos(a) * 0.07 * (i > 0), y + math.sin(a) * 0.07 * (i > 0), z + 0.1 + (0.03 if i == 0 else 0)), fm)


def vase(x, y, z, h=0.28, m='ceramic_d', branches=True):
    cyl('vase', 0.06, h, (x, y, z), M(m), verts=32, bevel=0.012)
    if branches:
        rnd = random.Random(int(x * 77))
        leaf = mat('twig', '#51603f', rough=0.6)
        for i in range(7):
            a, t = rnd.random() * math.tau, 0.15 + rnd.random() * 0.35
            L = 0.3 + rnd.random() * 0.3
            cyl('twig', 0.003, L, (x + math.cos(a) * math.sin(t) * L / 2, y + math.sin(a) * math.sin(t) * L / 2, z + h - 0.02), mat('twigw', '#4a3a2b', rough=0.8), verts=8, rot=(math.sin(a) * -t, math.cos(a) * t, 0))
            sphere('leaf', 0.03, (x + math.cos(a) * math.sin(t) * L, y + math.sin(a) * math.sin(t) * L, z + h + math.cos(t) * L - 0.02), leaf, scale=(1, 0.5, 1.6))


def stool(x, y, h=0.66, seat='#a2693f'):
    sm, lm = mat('leather' + seat, seat, rough=0.55), M('blackmetal')
    cyl('stool_seat', 0.185, 0.05, (x, y, h), sm, bevel=0.015)
    for a in range(4):
        ang = a * math.pi / 2 + math.pi / 4
        box('stool_leg', (0.02, 0.02, h), (x + math.cos(ang) * 0.13, y + math.sin(ang) * 0.13, 0), lm)
    cyl('stool_ring', 0.19, 0.012, (x, y, 0.22), lm, verts=48)


def pendants(xs, y, H, drop=1.0, r=0.14, shade='#1d1b18', power=12):
    for x in xs:
        lib.pendant(x, y, H, drop=drop, r=r, shade=shade, power=power)


def chair(x, y, rot=0.0, seat='#d9cfbf', leg='#c9a37a'):
    lm, sm = mat('chair_leg' + leg, leg, rough=0.5), mat('chair_seat' + seat, seat, rough=0.8)
    c, s = math.cos(rot), math.sin(rot)
    R = lambda dx, dy: (x + dx * c - dy * s, y + dx * s + dy * c)
    box('seat', (0.44, 0.44, 0.04), (x, y, 0.44), sm, bevel=0.015, rot=(0, 0, rot))
    for dx, dy in ((-0.19, -0.19), (0.19, -0.19), (-0.19, 0.19), (0.19, 0.19)):
        px, py = R(dx, dy)
        cyl('leg', 0.015, 0.44, (px, py, 0), lm, verts=16)
    bx, by = R(0, 0.2)
    box('back', (0.42, 0.025, 0.36), (bx, by, 0.52), sm, bevel=0.012, rot=(math.radians(-6), 0, rot))


def table(x, y, w=1.4, d=0.8, top='top_oak'):
    box('table_top', (w, d, 0.035), (x, y, 0.72), M(top), bevel=0.004)
    for dx in (-w / 2 + 0.08, w / 2 - 0.08):
        for dy in (-d / 2 + 0.08, d / 2 - 0.08):
            cyl('table_leg', 0.022, 0.72, (x + dx, y + dy, 0), M('blackmetal'), verts=16)


def sheer_curtain(W, window):
    """Полупрозрачный тюль в складку: рассеивает свет и закрывает вид из окна."""
    yc, ww, sill, wh = window
    m = bpy.data.materials.new('sheer')
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    n.remove(n['Principled BSDF'])
    tr, df, mx = n.new('ShaderNodeBsdfTranslucent'), n.new('ShaderNodeBsdfDiffuse'), n.new('ShaderNodeMixShader')
    tr.inputs['Color'].default_value = (0.95, 0.94, 0.9, 1)
    df.inputs['Color'].default_value = (0.9, 0.88, 0.84, 1)
    mx.inputs[0].default_value = 0.3
    l.new(tr.outputs[0], mx.inputs[1]); l.new(df.outputs[0], mx.inputs[2])
    l.new(mx.outputs[0], n['Material Output'].inputs['Surface'])
    x, y, k = -W / 2 + 0.16, yc - ww / 2 - 0.15, 0
    while y < yc + ww / 2 + 0.15:
        box('sheer', (0.002, 0.075, sill + wh + 0.25), (x + (0.012 if k % 2 else -0.012), y, 0.01), m, rot=(0, 0, math.radians(24 if k % 2 else -24)))
        y += 0.066
        k += 1
    box('cornice', (0.05, ww + 0.5, 0.03), (x, yc, sill + wh + 0.26), mat('cornice', '#e9e5dc', rough=0.5))


def shell(W, D, H, wall='wall_plaster', floor='floor_oak', window=(1.6, 1.8, 0.85, 1.6), back=None, right=None, sun=3.0, portal=110, sky=0.7, sun_dir=(0.8, 0.45, -0.42), sheer=True):
    """Комната со светом из окна слева."""
    lib.room(W, D, H, M(wall), M(floor), mat('ceil', '#f1eee8', rough=0.9), window=window, back_wall=M(back) if back else None, right_wall=M(right) if right else None)
    box('skirt_b', (W, 0.012, 0.07), (0, D - 0.006, 0), mat('skirt', '#e9e5dc', rough=0.5))
    lib.daylight(sun_dir=sun_dir, sun_strength=sun, window=window, W=W, sky_strength=sky, portal_strength=portal)
    if window and sheer:
        sheer_curtain(W, window)
    sc = bpy.context.scene
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.cycles.adaptive_threshold = 0.05
    sc.cycles.max_bounces = 8
    sc.cycles.diffuse_bounces = 4
