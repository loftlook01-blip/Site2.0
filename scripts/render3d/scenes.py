"""
Сцены для сайта. Каждая функция строит сцену и возвращает dict(exposure=…).
Запуск: python render.py <сцена> [--w 1600 --h 1200 --samples 96]
"""
import math
import lib, kit
from lib import box, cyl, sphere, mat
from kit import Run, M, CT, TOP_T, PL


def hero(cam='a'):
    """Кухня-гостиная: графит + дуб, остров, колонны с техникой. Главный кадр."""
    W, D, H = 7.2, 6.4, 2.9
    kit.shell(W, D, H, wall='wall_plaster', floor='floor_oak', window=(3.3, 3.2, 0.25, 2.35), sun=3.4, portal=150)
    c = dict(front=M('graphite'), top=M('marble'), handle='gola')
    r = Run('back', -3.3, D, c)
    r.tall(0.6, 'fridge', top=H - 0.012, m=M('oak'))
    r.tall(0.6, 'oven', top=H - 0.012, m=M('oak'))
    u0 = r.u
    for w, k in ((0.9, 'drawers3'), (0.6, 'dishwasher'), (0.8, 'doors2'), (0.9, 'drawers2'), (0.6, 'drawers3'), (0.6, 'door')):
        r.base(w, k)
    r.top(u0, r.u)
    r.splash(u0, r.u, m=M('marble'))
    r.sink(u0 + 1.9)
    r.hob(u0 + 2.75)
    # верх: два шкафа, дубовая ниша с полками, шкафы; антресоль до потолка
    r.wall(u0, (0.9, 0.6), light=True)
    r.b('niche_back', u0 + 1.5 + 0.85, 0.02, 1.5, 1.7, 0.02, 0.72, M('oak'))
    r.shelves(u0 + 1.52, u0 + 3.18, zs=(1.82,), m=M('oak'), depth=0.3, seed=4)
    r.wall(u0 + 3.2, (0.6, 0.6), light=True)
    r.ceil_row(u0, (0.9, 0.6, 0.85, 0.85, 0.6, 0.6), 2.223, H)
    kit.boards(-0.2, D - 0.06, CT + TOP_T)
    kit.vase(1.75, D - 0.25, CT + TOP_T, h=0.24)
    # остров
    ic = dict(front=M('graphite'), top=M('marble'), handle='gola', base_depth=0.9)
    isl = Run('free', -1.5, D - 2.2, ic)
    for w in (0.9, 0.9, 0.9):
        isl.base(w, 'drawers2')
    isl.top(0, isl.u, over=0.3, side_over=0.03, t=0.04)
    box('isl_side_l', (0.03, 1.22, CT), (-1.515, D - 2.2 - 0.61, 0), M('marble'), bevel=0.002)
    box('isl_side_r', (0.03, 1.22, CT), (1.215, D - 2.2 - 0.61, 0), M('marble'), bevel=0.002)
    for x in (-0.95, -0.15, 0.65):
        kit.stool(x, D - 3.55)
    kit.pendants((-0.9, -0.15, 0.6), D - 2.75, H, drop=1.15, r=0.12, power=9)
    kit.bowl(0.55, D - 2.7, CT + 0.04)
    kit.vase(3.0, D - 0.7, 0, h=0.55, m='ceramic_w')
    if cam == 'a':
        lib.camera((2.5, 1.1, 1.3), (-1.3, D, 1.12), lens=21)
    else:
        lib.camera((-1.4, 0.4, 1.3), (1.0, D, 1.2), lens=22)
    return dict(exposure=0.25)


def _line(r, mods):
    for w, k in mods:
        r.base(w, k)


def k_modern():
    """Современная: тёплый серо-бежевый без ручек, колонны в светлом дубе, шкафы до потолка."""
    W, D, H = 5.4, 4.8, 2.75
    kit.shell(W, D, H, wall='wall_white', floor='floor_oak', window=(2.6, 2.2, 0.8, 1.7), portal=120)
    c = dict(front=M('greige'), top=M('quartz_white'), handle='gola')
    r = Run('back', -2.4, D, c)
    r.tall(0.6, 'fridge', top=H - 0.012, m=M('white_oak'))
    r.tall(0.6, 'oven', top=H - 0.012, m=M('white_oak'))
    u0 = r.u
    _line(r, ((0.8, 'drawers3'), (0.6, 'dishwasher'), (0.8, 'doors2'), (0.8, 'drawers2'), (0.6, 'door')))
    r.top(u0, r.u); r.splash(u0, r.u); r.sink(u0 + 1.8); r.hob(u0 + 2.6)
    r.wall(u0, (0.8, 0.6, 0.8, 0.8, 0.6))
    r.ceil_row(u0, (0.8, 0.6, 0.8, 0.8, 0.6), 2.223, H)
    kit.boards(u0 - 2.4 + 0.35, D - 0.06, CT + TOP_T)
    kit.bowl(u0 - 2.4 + 3.3, D - 0.3, CT + TOP_T)
    kit.table(0.7, 1.9, 1.5, 0.85)
    for x, y, a in ((0.25, 1.25, math.pi), (1.15, 1.25, math.pi), (0.25, 2.55, 0), (1.15, 2.55, 0)):
        kit.chair(x, y, a)
    kit.vase(0.7, 1.9, 0.755, h=0.2, m='ceramic_w')
    kit.pendants((0.7,), 1.9, H, drop=1.1, r=0.2, shade='#d9cfbf', power=14)
    lib.camera((-1.9, 0.25, 1.4), (0.7, D, 1.1), lens=21)
    return dict(exposure=0.2)


def k_handleless():
    """Без ручек: шалфей + профиль Gola, угловая, дубовая столешница."""
    W, D, H = 4.6, 4.4, 2.7
    kit.shell(W, D, H, wall='wall_white', floor='floor_herring', window=(2.4, 1.9, 0.85, 1.55), portal=110)
    c = dict(front=M('sage'), top=M('quartz_white'), handle='gola')
    r = Run('back', -2.3, D, c)
    _line(r, ((0.6, 'drawers3'), (0.8, 'doors2'), (0.6, 'dishwasher'), (0.9, 'drawers2'), (0.5, 'drawers3'), (0.6, 'panel')))
    r.top(0, r.u - 0.6); r.splash(0, r.u); r.sink(1.0); r.hob(2.45, 0.58)
    r.wall(0, (0.6, 0.8, 0.6, 0.9, 0.5), h=0.9)
    r2 = Run('right', D - 0.6, W / 2, c)
    _line(r2, ((0.8, 'drawers2'), (0.6, 'drawers3')))
    r2.tall(0.6, 'oven', top=2.4)
    r2.top(-0.62, 1.4)
    r2.wall(0, (0.8, 0.6), h=0.9)
    kit.boards(-1.2, D - 0.06, CT + TOP_T)
    kit.vase(W / 2 - 0.3, D - 1.2, CT + TOP_T, h=0.22)
    kit.bowl(0.6, D - 0.3, CT + TOP_T, fruit='#7a9a3a')
    lib.camera((-1.7, 0.2, 1.4), (0.9, D, 1.05), lens=20)
    return dict(exposure=0.2)


def k_neoclassic():
    """Неоклассика: рамочные фасады, латунь, мрамор, ёлочка."""
    W, D, H = 5.2, 4.8, 2.9
    kit.shell(W, D, H, wall='wall_warm', floor='floor_herring', window=(2.6, 2.0, 0.8, 1.8), portal=120)
    c = dict(front=M('cream'), top=M('marble'), handle='knob', handle_m=M('brass'), tap_m=M('brass'), frame=True)
    r = Run('back', -2.2, D, c)
    r.tall(0.6, 'door', top=2.42)
    u0 = r.u
    _line(r, ((0.6, 'drawers3'), (0.8, 'doors2'), (0.9, 'oven'), (0.6, 'drawers3'), (0.3, 'door')))
    r.tall(0.6, 'door', top=2.42)
    r.top(u0, u0 + 3.2); r.splash(u0, u0 + 3.2, m=M('marble')); r.sink(u0 + 1.0); r.hob(u0 + 1.85, 0.75)
    r.wall(u0, (0.6, 0.4), h=0.92, light=True)
    r.wall(u0 + 2.3, (0.5, 0.4), h=0.92, light=True)
    # портал вытяжки
    r.b('hood', u0 + 1.65, 0.2, 1.72, 1.3, 0.4, 0.7, M('cream'), bevel=0.01)
    r.b('hood_trim', u0 + 1.65, 0.21, 1.70, 1.34, 0.42, 0.04, M('brass'), bevel=0.004)
    r.b('cornice', 2.2, 0.31, 2.42, 4.42, 0.62, 0.06, M('cream'), bevel=0.012)
    kit.vase(u0 - 2.2 + 0.4, D - 0.25, CT + TOP_T, h=0.26, m='ceramic_w')
    kit.bowl(u0 - 2.2 + 2.9, D - 0.3, CT + TOP_T)
    kit.table(1.2, 2.0, 1.3, 0.8, top='walnut')
    for x, y, a in ((0.85, 1.42, math.pi), (1.55, 1.42, math.pi), (0.85, 2.58, 0), (1.55, 2.58, 0)):
        kit.chair(x, y, a, seat='#8c967f', leg='#3a2f26')
    kit.pendants((1.2,), 2.0, H, drop=1.05, r=0.24, shade='#b08a4e', power=16)
    lib.camera((-1.7, 0.2, 1.45), (0.3, D, 1.2), lens=22)
    return dict(exposure=0.15)


def k_scandi():
    """Скандинавская: белые фасады, дубовая столешница, открытые полки."""
    W, D, H = 4.4, 4.2, 2.65
    kit.shell(W, D, H, wall='wall_white', floor='floor_oak', window=(2.2, 1.9, 0.85, 1.5), portal=120)
    c = dict(front=M('white'), top=M('top_oak'), handle='knob', handle_m=M('top_oak'), splash=M('ceramic_w'))
    r = Run('back', -2.2, D, c)
    _line(r, ((0.6, 'drawers3'), (0.8, 'doors2'), (0.6, 'dishwasher'), (0.6, 'oven'), (0.6, 'drawers3')))
    r.tall(0.6, 'fridge', top=2.22)
    r.top(0, 3.2); r.splash(0, 3.2); r.sink(1.0); r.hob(2.3)
    r.wall(0, (0.6, 0.6), light=True)
    r.shelves(1.25, 3.15, zs=(1.52, 1.9), m=M('top_oak'), seed=7)
    kit.boards(-0.5, D - 0.06, CT + TOP_T)
    kit.vase(0.7, D - 0.3, CT + TOP_T, h=0.2, m='ceramic_t')
    kit.table(0.4, 1.6, 1.2, 0.75)
    for x, y, a in ((0.05, 1.05, math.pi), (0.75, 1.05, math.pi), (0.4, 2.2, 0)):
        kit.chair(x, y, a, seat='#efe9df')
    kit.pendants((0.4,), 1.6, H, drop=1.0, r=0.2, shade='#efe9df', power=12)
    lib.rug(0.4, 1.6, 2.2, 1.6, '#cfc6b5')
    lib.camera((-1.5, 0.2, 1.4), (0.8, D, 1.0), lens=21)
    return dict(exposure=0.25)


def k_loft():
    """Лофт: чёрные фасады, кирпич, тёмный дуб, металл."""
    W, D, H = 6.0, 5.4, 3.0
    kit.shell(W, D, H, wall='wall_dark', floor='floor_oak', window=(2.8, 2.6, 0.5, 2.1), back='concrete', portal=170, sun=4.0)
    c = dict(front=M('black'), top=M('top_oak'), handle='bar', handle_m=M('blackmetal'))
    r = Run('back', -2.7, D, c)
    r.tall(0.6, 'fridge', top=2.4, m=M('black_oak'))
    r.tall(0.6, 'oven', top=2.4, m=M('black_oak'))
    u0 = r.u
    _line(r, ((0.9, 'drawers3'), (0.8, 'doors2'), (0.9, 'drawers2'), (0.6, 'drawers3')))
    r.top(u0, r.u); r.sink(u0 + 1.3); r.hob(u0 + 2.15)
    # полки на чёрном металле
    for z in (1.5, 1.9):
        r.b('shelf', u0 + 1.6, 0.14, z, 3.1, 0.28, 0.04, M('black_oak'), bevel=0.003)
    for du in (0.1, 1.6, 3.1):
        r.b('post', u0 + du, 0.14, CT + TOP_T, 0.02, 0.02, 1.4, M('blackmetal'))
    r.shelves(u0 + 0.2, u0 + 3.0, zs=(1.505, 1.905), m=M('black_oak'), depth=0.26, seed=3)
    ic = dict(front=M('black_oak'), top=M('compact_black'), handle='none', base_depth=0.8)
    isl = Run('free', -1.1, D - 2.1, ic)
    for w in (0.8, 0.8, 0.8):
        isl.base(w, 'panel')
    isl.top(0, isl.u, over=0.28, side_over=0.02, t=0.03)
    for x in (-0.6, 0.1, 0.8):
        kit.stool(x, D - 3.35)
    kit.pendants((-0.6, 0.1, 0.8), D - 2.6, H, drop=1.2, r=0.16, power=10)
    kit.bowl(0.6, D - 2.5, CT + 0.03)
    lib.camera((2.2, 0.2, 1.35), (-0.9, D, 1.15), lens=21)
    for z in (1.5, 1.9):
        lib.area((-2.7 + u0 + 1.6, D - 0.16, z - 0.01), (0, 0, 0), 2.8, 26, '#ffd9a8', size_y=0.08)
    return dict(exposure=0.75)


def k_corner():
    """Угловая: графитовый низ, белый верх, типовая кухня 9 м²."""
    W, D, H = 3.6, 3.6, 2.6
    kit.shell(W, D, H, wall='wall_plaster', floor='floor_tile', window=(1.9, 1.5, 0.9, 1.4), portal=90)
    c = dict(front=M('graphite'), top=M('quartz_grey'), handle='bar', handle_m=M('steel'), splash=M('ceramic_w'))
    cw = dict(c, front=M('white'))
    r = Run('back', -1.8, D, c)
    _line(r, ((0.45, 'drawers3'), (0.6, 'oven'), (0.6, 'drawers3'), (0.6, 'doors2'), (0.75, 'panel'), (0.6, 'panel')))
    r.top(0, 3.0); r.splash(0, 3.6); r.hob(0.75)
    Run('back', -1.8, D, cw).wall(0, (0.45, 0.6, 0.6, 0.6, 0.75), h=0.9)
    r2 = Run('right', D - 0.6, W / 2, c)
    _line(r2, ((0.8, 'doors2'), (0.45, 'dishwasher'), (0.4, 'drawers3')))
    r2.top(-0.62, 1.65); r2.splash(0, 1.65); r2.sink(0.4)
    Run('right', D - 0.6, W / 2, cw).wall(0, (0.8, 0.45, 0.4), h=0.9)
    kit.boards(-0.9, D - 0.06, CT + TOP_T)
    kit.vase(W / 2 - 0.3, D - 1.7, CT + TOP_T, h=0.2, m='ceramic_w')
    lib.camera((-1.35, 0.15, 1.45), (0.75, D - 0.2, 1.05), lens=18)
    return dict(exposure=0.3)


def k_straight():
    """Прямая: глубокий синий, латунь, белый кварц."""
    W, D, H = 4.0, 3.6, 2.7
    kit.shell(W, D, H, wall='wall_white', floor='floor_oak', window=(1.9, 1.7, 0.85, 1.5), portal=100)
    c = dict(front=M('navy'), top=M('quartz_white'), handle='bar', handle_m=M('brass'), tap_m=M('brass'))
    r = Run('back', -1.9, D, c)
    r.tall(0.6, 'oven', top=2.4)
    u0 = r.u
    _line(r, ((0.6, 'drawers3'), (0.8, 'doors2'), (0.6, 'dishwasher'), (0.6, 'drawers2')))
    r.tall(0.6, 'fridge', top=2.4)
    r.top(u0, u0 + 2.6); r.splash(u0, u0 + 2.6); r.sink(u0 + 1.0); r.hob(u0 + 2.25, 0.45)
    r.wall(u0, (0.6, 0.8, 0.6, 0.6), h=0.9)
    kit.boards(-1.1, D - 0.06, CT + TOP_T)
    kit.bowl(0.25, D - 0.3, CT + TOP_T)
    lib.rug(0.0, 1.9, 2.4, 1.0, '#d9cfbf')
    lib.camera((1.3, 0.15, 1.4), (-0.5, D, 1.1), lens=20)
    return dict(exposure=0.3)


def k_island():
    """С островом: светлый дуб и белый, остров с мраморным «водопадом»."""
    W, D, H = 6.6, 6.0, 2.9
    kit.shell(W, D, H, wall='wall_white', floor='floor_herring', window=(3.0, 3.0, 0.3, 2.3), portal=150)
    c = dict(front=M('white'), top=M('marble'), handle='gola')
    r = Run('back', -2.4, D, c)
    r.tall(0.6, 'fridge', top=H - 0.012); r.tall(0.6, 'fridge', top=H - 0.012); r.tall(0.6, 'oven', top=H - 0.012)
    u0 = r.u
    _line(r, ((0.9, 'drawers3'), (0.9, 'doors2'), (0.6, 'drawers3'), (0.6, 'door')))
    r.top(u0, r.u); r.splash(u0, r.u, m=M('marble')); r.sink(u0 + 1.35)
    r.wall(u0, (0.9, 0.9, 0.6, 0.6), h=H - 1.5 - 0.012)
    ic = dict(front=M('white_oak'), top=M('marble'), handle='gola', base_depth=0.95)
    isl = Run('free', -1.3, D - 2.1, ic)
    for w in (0.9, 0.9, 0.9):
        isl.base(w, 'drawers2')
    isl.top(0, isl.u, over=0.28, side_over=0.03, t=0.04)
    isl.hob(1.35, 0.75)
    for x in (-1.315, 1.415):
        box('fall', (0.03, 1.25, CT), (x, D - 2.1 - 0.625, 0), M('marble'), bevel=0.002)
    for x in (-0.8, 0.0, 0.8):
        kit.stool(x, D - 3.5, seat='#d9cfbf')
    kit.pendants((-0.7, 0.75), D - 2.65, H, drop=1.1, r=0.2, shade='#efe9df', power=14)
    kit.vase(-0.6, D - 2.5, CT + 0.04, h=0.3, m='ceramic_w')
    lib.camera((-2.7, 0.5, 1.4), (0.5, D, 1.05), lens=18)
    return dict(exposure=0.25)


def k_small():
    """Маленькая кухня 5,5 м²: белый без ручек до потолка, узкие модули, техника 45 см."""
    W, D, H = 2.4, 2.9, 2.5
    kit.shell(W, D, H, wall='wall_white', floor='floor_tile', window=(1.7, 1.2, 0.9, 1.35), portal=70)
    c = dict(front=M('white'), top=M('top_oak'), handle='gola', splash=M('ceramic_w'))
    r = Run('back', -1.2, D, c)
    _line(r, ((0.45, 'oven'), (0.45, 'drawers3'), (0.45, 'dishwasher'), (0.45, 'doors2'), (0.6, 'panel')))
    r.top(0, 1.8); r.splash(0, 2.4); r.hob(0.22, 0.42)
    r.wall(0, (0.45, 0.45, 0.45, 0.45), h=H - 1.5 - 0.012)
    r2 = Run('right', D - 0.6, W / 2, c)
    _line(r2, ((0.6, 'doors2'), (0.4, 'drawers3')))
    r2.top(-0.62, 1.0); r2.splash(0, 1.0); r2.sink(0.3, 0.42)
    r2.wall(0, (0.6, 0.4), h=H - 1.5 - 0.012)
    kit.boards(-0.3, D - 0.06, CT + TOP_T)
    kit.vase(W / 2 - 0.28, D - 1.45, CT + TOP_T, h=0.18, m='ceramic_t')
    lib.camera((-0.75, 0.05, 1.45), (0.45, D, 1.15), lens=16)
    return dict(exposure=0.35)


def k_ceiling():
    """До потолка: терракотовый низ, кремовый верх в два яруса."""
    W, D, H = 4.8, 4.2, 2.8
    kit.shell(W, D, H, wall='wall_warm', floor='floor_oak', window=(2.2, 1.9, 0.8, 1.7), portal=110)
    c = dict(front=M('terracotta'), top=M('quartz_white'), handle='gola')
    cu = dict(c, front=M('cream'))
    r = Run('back', -2.4, D, c)
    r.tall(0.6, 'fridge', top=2.22, m=M('cream'))
    r.tall(0.6, 'oven', top=2.22, m=M('cream'))
    u0 = r.u
    _line(r, ((0.8, 'drawers3'), (0.8, 'doors2'), (0.6, 'dishwasher'), (0.8, 'drawers2'), (0.6, 'door')))
    r.top(u0, r.u); r.splash(u0, r.u); r.sink(u0 + 1.2); r.hob(u0 + 2.6)
    ru = Run('back', -2.4, D, cu)
    ru.wall(u0, (0.8, 0.8, 0.6, 0.8, 0.6))
    ru.ceil_row(0, (0.6, 0.6), 2.223, H, depth=0.58)
    ru.ceil_row(u0, (0.8, 0.8, 0.6, 0.8, 0.6), 2.223, H)
    kit.boards(u0 - 2.4 + 0.3, D - 0.06, CT + TOP_T)
    kit.bowl(u0 - 2.4 + 1.9, D - 0.3, CT + TOP_T, fruit='#c9622f')
    kit.vase(u0 - 2.4 + 3.3, D - 0.25, CT + TOP_T, h=0.24, m='ceramic_w')
    lib.camera((1.6, 0.2, 1.3), (-0.4, D, 1.35), lens=20)
    return dict(exposure=0.2)


def cta():
    return hero(cam='b')


# ───────────────────────── Корпусная мебель ─────────────────────────

def _bed(x, y, w=1.6, d=2.0):
    box('bed_base', (w + 0.06, d + 0.06, 0.3), (x, y, 0), M('white_oak'), bevel=0.006)
    m = box('mattress', (w, d, 0.2), (x, y, 0.3), M('linen'), bevel=0.04)
    box('blanket', (w + 0.04, d * 0.6, 0.04), (x, y - d * 0.2, 0.5), mat('blanket', '#8c967f', rough=0.95), bevel=0.02)
    for dx in (-w / 4, w / 4):
        lib.soft(box('pillow', (w / 2 - 0.12, 0.42, 0.12), (x + dx, y + d / 2 - 0.3, 0.5), mat('pillow', '#efeae0', rough=0.95), bevel=0.04), 2)


def f_wardrobe():
    """Встроенный шкаф-купе: дуб + бронзовое зеркало, от пола до потолка."""
    W, D, H = 4.2, 4.0, 2.7
    kit.shell(W, D, H, wall='wall_warm', floor='floor_oak', window=(1.9, 1.7, 0.8, 1.6), portal=100)
    x0, n, w = -1.8, 4, 0.9
    box('wr_body', (n * w, 0.6, H), (0, D - 0.3, 0), M('carcass'))
    mats = (M('white_oak'), mat('bronze_mirror', '#8a7560', rough=0.03, metal=1.0), M('white_oak'), M('white_oak'))
    for i in range(n):
        dy = 0.62 if i % 2 else 0.66
        box('door', (w - 0.004, 0.018, H - 0.06), (x0 + w / 2 + i * w, D - dy, 0.03), mats[i], bevel=0.001)
        for dx in (-w / 2 + 0.012, w / 2 - 0.012):
            box('prof', (0.022, 0.03, H - 0.06), (x0 + w / 2 + i * w + dx, D - dy, 0.03), M('blackmetal'))
    box('rail_t', (n * w, 0.09, 0.03), (0, D - 0.64, H - 0.03), M('blackmetal'))
    box('rail_b', (n * w, 0.09, 0.03), (0, D - 0.64, 0), M('blackmetal'))
    _bed(0.9, 1.3)
    lib.rug(-0.6, 1.4, 1.4, 2.2, '#d9cfbf')
    kit.vase(-1.5, 3.0, 0, h=0.6, m='ceramic_w')
    lib.camera((-1.6, 0.2, 1.3), (0.6, D, 1.2), lens=22)
    return dict(exposure=0.25)


def f_closet():
    """Гардеробная: открытая система хранения с подсветкой."""
    W, D, H = 3.0, 3.0, 2.6
    kit.shell(W, D, H, wall='wall_warm', floor='floor_oak', window=None, portal=0, sun=0.0, sky=0.05)
    wood, dark = M('white_oak'), M('carcass')
    import random
    rnd = random.Random(5)
    cols = ('#d9cfbf', '#2b2d2f', '#8c967f', '#b3a999', '#243245', '#a65f43', '#efeae0', '#6b5a45')

    def section(run, u, w, kind):
        run.b('side', u, 0.26, 0, 0.018, 0.52, H - 0.3, wood)
        run.b('top', u + w / 2, 0.26, H - 0.3, w, 0.52, 0.018, wood)
        run.b('backp', u + w / 2, 0.006, 0, w, 0.012, H - 0.3, wood)
        size, loc = run.P(u + w / 2, 0.47, H - 0.32, w - 0.06, 0.01, 0.004)
        box('led', size, loc, lib.mat_emit('led_c', '#ffe7c4', 10))
        size, loc = run.P(u + w / 2, 0.3, H - 0.34, 0, 0, 0)
        lib.area(loc, (0, 0, 0 if run.o == 'back' else 90), w * 0.8, 14, '#ffe2bd', size_y=0.1)
        if kind == 'hang':
            size, loc = run.P(u + w / 2, 0.28, 1.95, w - 0.03, 0.02, 0.02)
            box('rod', size, loc, M('blackmetal'))
            x = 0.07
            while x < w - 0.06:
                L = 0.7 + rnd.random() * 0.45
                run.b('cloth', u + x, 0.28, 1.93 - L, 0.03 + rnd.random() * 0.02, 0.42, L, mat('cl' + str(rnd.randint(0, 7)), rnd.choice(cols), rough=0.9), bevel=0.01)
                x += 0.06 + rnd.random() * 0.035
            for i in range(2):
                run.b('drawer', u + w / 2, 0.5, 0.08 + i * 0.26, w - 0.03, 0.02, 0.25, wood, bevel=0.002)
            run.b('dbody', u + w / 2, 0.25, 0.06, w - 0.02, 0.5, 0.54, dark)
        else:
            for z in (0.06, 0.42, 0.78, 1.14, 1.5, 1.86):
                run.b('shelf', u + w / 2, 0.26, z, w - 0.02, 0.5, 0.018, wood)
                x = 0.1
                while x < w - 0.12 and z > 0.1:
                    if rnd.random() < 0.75:
                        hh = 0.03 * rnd.randint(2, 6)
                        run.b('fold', u + x + 0.11, 0.3, z + 0.018, 0.22, 0.3, hh, mat('cl' + str(rnd.randint(0, 7)), rnd.choice(cols), rough=0.95), bevel=0.012)
                    x += 0.27

    rb = Run('back', -W / 2, D, {})
    u = 0.0
    for w, k in ((0.9, 'hang'), (0.6, 'shelf'), (0.9, 'hang'), (0.6, 'shelf')):
        section(rb, u, w, k); u += w
    rr = Run('right', D - 0.54, W / 2, {})
    u = 0.0
    for w, k in ((0.8, 'shelf'), (0.9, 'hang')):
        section(rr, u, w, k); u += w
    rr.b('side', u, 0.26, 0, 0.018, 0.52, H - 0.3, wood)
    lib.soft(box('pouf', (0.5, 0.5, 0.38), (-0.5, 1.4, 0), M('linen'), bevel=0.06), 2)
    lib.area((0, 1.2, H - 0.05), (0, 0, 0), 1.2, 160, '#fff1dc')
    lib.camera((-1.1, 0.0, 1.35), (0.5, D, 1.1), lens=18)
    return dict(exposure=0.4)


def f_hall():
    """Прихожая: шкаф, ниша с банкеткой, зеркало."""
    W, D, H = 3.2, 3.2, 2.6
    kit.shell(W, D, H, wall='wall_white', floor='floor_tile', window=(1.6, 1.4, 0.9, 1.4), portal=90)
    c = dict(front=M('greige'), handle='gola')
    r = Run('back', -1.5, D, c)
    r.tall(0.5, 'door', top=H - 0.012); r.tall(0.5, 'door', top=H - 0.012)
    u = r.u
    # ниша с банкеткой
    r.b('bench', u + 0.6, 0.22, 0.0, 1.2, 0.44, 0.42, M('white_oak'), bevel=0.003)
    lib.soft(r.b('cushion', u + 0.6, 0.22, 0.42, 1.14, 0.4, 0.07, M('linen'), bevel=0.025), 2)
    r.b('niche_back', u + 0.6, 0.012, 0.42, 1.2, 0.024, 1.5, M('white_oak'))
    for i in range(4):
        size, loc = r.P(u + 0.2 + i * 0.27, 0.05, 1.62, 0, 0, 0)
        cyl('hook', 0.014, 0.05, loc, M('blackmetal'), verts=20, rot=(math.radians(90), 0, 0))
    r.b('coat', u + 0.3, 0.09, 0.75, 0.34, 0.1, 0.86, mat('coat', '#6b5a45', rough=0.95), bevel=0.03)
    r.b('coat2', u + 0.78, 0.08, 0.95, 0.3, 0.08, 0.66, mat('coat2', '#243245', rough=0.95), bevel=0.03)
    r.b('top_cab', u + 0.6, 0.22, 1.95, 1.2, 0.44, H - 1.95 - 0.012, M('greige'), bevel=0.002)
    r.b('top_gap', u + 0.6, 0.445, 1.95, 0.004, 0.004, H - 1.97, M('carcass'))
    for i in range(3):
        box('shoe', (0.1, 0.26, 0.09), (-1.5 + u + 0.25 + i * 0.3, D - 0.6, 0), mat('shoe' + str(i), ('#2a2826', '#8a6a4a', '#d9cfbf')[i], rough=0.6), bevel=0.03)
    # зеркало на правой стене
    cyl('mirror', 0.42, 0.012, (W / 2 - 0.02, 1.9, 1.05), M('mirror'), rot=(0, math.radians(90), 0))
    cyl('mirror_fr', 0.44, 0.02, (W / 2 - 0.012, 1.9, 1.03), M('blackmetal'), rot=(0, math.radians(90), 0))
    box('console', (0.3, 0.9, 0.035), (W / 2 - 0.15, 1.9, 0.78), M('white_oak'), bevel=0.003)
    kit.vase(W / 2 - 0.16, 2.15, 0.815, h=0.2, m='ceramic_w')
    lib.rug(-0.2, 1.5, 1.0, 1.8, '#b3a999')
    lib.camera((-1.2, 0.05, 1.35), (0.25, D, 1.15), lens=18)
    return dict(exposure=0.3)


def f_bath():
    """Ванная: подвесная тумба из дуба, накладная раковина, круглое зеркало с подсветкой."""
    W, D, H = 3.0, 2.8, 2.6
    kit.shell(W, D, H, wall='wall_tile', floor='floor_tile', window=None, sun=0, sky=0.05, portal=0)
    oak = M('oak')
    box('vanity', (1.4, 0.48, 0.42), (-0.2, D - 0.24, 0.42), oak, bevel=0.003)
    box('v_gap', (1.404, 0.004, 0.004), (-0.2, D - 0.482, 0.63), M('carcass'))
    box('v_top', (1.44, 0.5, 0.03), (-0.2, D - 0.25, 0.84), M('quartz_white'), bevel=0.003)
    cyl('basin', 0.2, 0.12, (-0.45, D - 0.27, 0.87), M('ceramic_w'), verts=64, bevel=0.012)
    cyl('basin_in', 0.175, 0.01, (-0.45, D - 0.27, 0.985), mat('basin_in', '#d8d4cb', rough=0.3), verts=64)
    cyl('tap', 0.012, 0.3, (-0.45, D - 0.06, 0.87), M('blackmetal'), verts=20)
    box('spout', (0.02, 0.16, 0.02), (-0.45, D - 0.13, 1.16), M('blackmetal'), bevel=0.004)
    cyl('mirror', 0.42, 0.01, (-0.45, D - 0.03, 1.2), M('mirror'), rot=(math.radians(90), 0, 0))
    cyl('glow', 0.45, 0.006, (-0.45, D - 0.012, 1.17), lib.mat_emit('mglow', '#ffe9cc', 9), rot=(math.radians(90), 0, 0))
    box('pencil', (0.4, 0.34, 1.7), (1.0, D - 0.17, 0.42), M('greige'), bevel=0.002)
    box('pencil_gap', (0.404, 0.004, 0.004), (1.0, D - 0.342, 1.3), M('carcass'))
    for i, cc in enumerate(('#efeae0', '#b3a999')):
        lib.soft(box('towel', (0.3, 0.2, 0.06), (0.25, D - 0.3, 0.87 + i * 0.06), mat('towel' + str(i), cc, rough=0.95), bevel=0.02), 1)
    kit.vase(0.4, D - 0.12, 0.87, h=0.16, m='ceramic_d', branches=True)
    lib.area((-0.2, 1.2, H - 0.05), (0, 0, 0), 1.4, 260, '#fff4e4')
    lib.area((-0.45, D - 0.6, 2.2), (25, 0, 0), 0.5, 40, '#ffe2bd')
    lib.camera((0.95, 0.15, 1.3), (-0.45, D, 1.05), lens=24)
    return dict(exposure=0.3)


def f_kids():
    """Детская: кровать-чердак с рабочим местом и шкафом."""
    W, D, H = 3.6, 3.4, 2.65
    kit.shell(W, D, H, wall='wall_white', floor='floor_oak', window=(1.6, 1.5, 0.85, 1.5), portal=100)
    ply, white, sage = M('plywood'), M('white'), M('sage')
    x0 = -0.2
    # шкаф справа
    c = dict(front=sage, handle='gola')
    r = Run('back', 0.95, D, c)
    r.tall(0.45, 'door', top=2.4); r.tall(0.45, 'door', top=2.4)
    # чердак
    for dx in (-1.0, 1.0):
        box('post', (0.05, 0.9, 1.5), (x0 + dx, D - 0.5, 0), ply, bevel=0.003)
    box('deck', (2.05, 0.95, 0.06), (x0, D - 0.5, 1.5), ply, bevel=0.004)
    box('matt', (1.95, 0.85, 0.14), (x0, D - 0.48, 1.56), M('linen'), bevel=0.04)
    box('rail', (2.05, 0.03, 0.34), (x0, D - 0.965, 1.56), ply, bevel=0.004)
    lib.soft(box('pillow', (0.45, 0.6, 0.12), (x0 - 0.7, D - 0.45, 1.7), mat('pillow_k', '#d9a12b', rough=0.95), bevel=0.04), 2)
    for i in range(5):
        box('step', (0.42, 0.04, 0.03), (x0 + 1.28, D - 0.95, 0.25 + i * 0.27), ply, bevel=0.003)
    for dx in (1.08, 1.48):
        box('ladder', (0.035, 0.05, 1.9), (x0 + dx, D - 0.95, 0), ply, bevel=0.003)
    # стол и полки под чердаком
    box('desk', (1.5, 0.6, 0.03), (x0 - 0.2, D - 0.35, 0.72), white, bevel=0.003)
    box('desk_side', (0.03, 0.6, 0.72), (x0 + 0.53, D - 0.35, 0), white)
    for z in (1.05, 1.28):
        box('dshelf', (1.2, 0.2, 0.022), (x0 - 0.35, D - 0.12, z), ply, bevel=0.002)
    import random
    rnd = random.Random(2)
    for z in (1.072, 1.302):
        x = x0 - 0.9
        while x < x0 + 0.2:
            w = 0.025 + rnd.random() * 0.03
            box('book', (w, 0.15, 0.16 + rnd.random() * 0.05), (x, D - 0.12, z), mat('bk' + str(rnd.randint(0, 5)), rnd.choice(('#a65f43', '#243245', '#8c967f', '#efeae0', '#d9a12b', '#2b2d2f')), rough=0.7))
            x += w + 0.004
    kit.chair(x0 - 0.2, D - 0.95, math.pi, seat='#d9a12b', leg='#efeae0')
    box('led_k', (1.4, 0.012, 0.004), (x0 - 0.2, D - 0.2, 1.494), lib.mat_emit('ledk', '#ffe7c4', 12))
    lib.area((x0 - 0.2, D - 0.4, 1.47), (0, 0, 0), 1.3, 10, '#ffe2bd', size_y=0.2)
    lib.rug(-0.3, 1.4, 1.8, 1.4, '#d9cfbf')
    lib.camera((-1.35, 0.1, 1.4), (0.25, D, 1.1), lens=20)
    return dict(exposure=0.25)


def f_living():
    """Гостиная: ТВ-зона с реечной панелью и парящей тумбой."""
    W, D, H = 5.0, 4.4, 2.8
    kit.shell(W, D, H, wall='wall_plaster', floor='floor_oak', window=(2.2, 2.2, 0.4, 2.0), portal=120)
    wal = M('walnut')
    box('panel', (2.4, 0.03, H), (-0.3, D - 0.015, 0), M('wall_dark'))
    x = -1.5
    while x < 0.9:
        box('slat', (0.03, 0.035, H), (x, D - 0.045, 0), wal, bevel=0.002)
        x += 0.06
    box('tv', (1.45, 0.03, 0.82), (-0.3, D - 0.08, 1.05), M('glass_black'), bevel=0.004)
    box('low', (3.0, 0.42, 0.34), (-0.1, D - 0.21, 0.26), M('greige'), bevel=0.003)
    for dx in (-0.75, 0, 0.75):
        box('low_gap', (0.004, 0.004, 0.34), (-0.1 + dx, D - 0.421, 0.26), M('carcass'))
    box('low_top', (3.04, 0.44, 0.02), (-0.1, D - 0.22, 0.6), wal, bevel=0.002)
    # стеллаж справа
    c = dict(front=M('greige'), handle='gola')
    for i, z in enumerate((0.26, 0.9, 1.4, 1.9, 2.4)):
        box('sh', (1.1, 0.32, 0.03), (1.75, D - 0.16, z), wal, bevel=0.002)
    for dx in (-0.55, 0.55):
        box('sh_side', (0.03, 0.32, 2.2), (1.75 + dx, D - 0.16, 0.26), wal)
    kit.vase(1.5, D - 0.16, 0.93, h=0.24, m='ceramic_w')
    kit.vase(1.95, D - 0.16, 1.43, h=0.16, m='ceramic_t', branches=False)
    import random
    rnd = random.Random(3)
    for z in (1.93, 0.93):
        x = 1.75 if z < 1 else 1.35
        for k in range(9):
            w = 0.025 + rnd.random() * 0.03
            box('book', (w, 0.2, 0.2 + rnd.random() * 0.07), (x, D - 0.16, z), mat('bk' + str(rnd.randint(0, 5)), rnd.choice(('#a65f43', '#243245', '#8c967f', '#efeae0', '#6b5a45', '#2b2d2f')), rough=0.7))
            x += w + 0.004
    box('led_l', (2.9, 0.012, 0.004), (-0.1, D - 0.05, 0.25), lib.mat_emit('ledl', '#ffe7c4', 16))
    # диван на переднем плане
    lib.soft(box('sofa', (2.2, 0.95, 0.42), (-0.4, 1.3, 0.08), M('linen'), bevel=0.06), 2)
    lib.soft(box('sofa_back', (2.2, 0.25, 0.5), (-0.4, 0.95, 0.4), M('linen'), bevel=0.06), 2)
    lib.rug(-0.3, 2.4, 2.8, 1.8, '#cfc6b5')
    box('ct', (0.9, 0.5, 0.03), (-0.2, 2.5, 0.3), wal, bevel=0.004)
    for dx in (-0.4, 0.4):
        box('ct_leg', (0.02, 0.46, 0.3), (-0.2 + dx, 2.5, 0), M('blackmetal'))
    lib.camera((1.6, 0.1, 1.25), (-0.5, D, 1.0), lens=22)
    return dict(exposure=0.25)


# ───────────────────────── Производство ─────────────────────────

def _shop(W=11, D=11, H=4.6, cam=None):
    floor = lib.mat_noise('shopfloor', '#5f5d58', '#73706a', scale=1.2, rough=0.45, bump=0.04)
    lib.room(W, D, H, mat('shopwall', '#bfbcb5', rough=0.8), floor, mat('shoproof', '#c9c6bf', rough=0.8), window=(5.5, 6.0, 1.6, 2.2))
    for k in range(3):
        for j in range(3):
            x, y = -3 + k * 3, 2.2 + j * 3.2
            box('lamp', (0.2, 1.5, 0.05), (x, y, H - 0.5), lib.mat_emit('shoplamp', '#fff3de', 16))
            lib.area((x, y, H - 0.56), (0, 0, 0), 0.2, 170, '#fff1dc', size_y=1.5)
    box('lane', (0.08, D, 0.003), (-2.9, D / 2, 0), mat('lane', '#d9a62b', rough=0.6))
    lib.daylight(sun_dir=(0.85, 0.4, -0.45), sun_strength=1.5, window=(5.5, 6.0, 1.6, 2.2), W=W, sky_strength=0.5, portal_strength=120)
    import bpy
    bpy.context.scene.cycles.adaptive_threshold = 0.05
    return W, D, H


def _stack(x, y, n=16, w=2.75, d=1.25, seed=1, rot=0):
    import random
    rnd = random.Random(seed)
    box('pallet', (w + 0.05, d + 0.05, 0.12), (x, y, 0), M('plywood'))
    ms = (M('ldsp_white'), M('greige'), M('white_oak'), M('graphite'))
    m = ms[seed % 4]
    for j in range(n):
        if rnd.random() < 0.18:
            m = rnd.choice(ms)
        box('sheet', (w, d, 0.018), (x + rnd.uniform(-0.01, 0.01), y + rnd.uniform(-0.01, 0.01), 0.12 + j * 0.0185), m)


def w_cut():
    """Раскрой: форматно-раскроечный станок и пачки плит."""
    W, D, H = _shop()
    steel, body, red = mat('machine', '#dcdad4', rough=0.4, metal=0.3), mat('machine_b', '#3b4a52', rough=0.5), mat('machine_r', '#b4623a', rough=0.5)
    box('saw_body', (1.5, 1.1, 0.82), (0.4, 5.4, 0), body, bevel=0.02)
    box('saw_table', (1.6, 1.3, 0.06), (0.4, 5.4, 0.82), steel, bevel=0.006)
    box('slide', (0.42, 3.4, 0.07), (-0.75, 5.2, 0.815), mat('alu', '#c9c8c4', rough=0.3, metal=0.9), bevel=0.006)
    box('slide_base', (0.3, 2.2, 0.72), (-0.75, 5.2, 0), body, bevel=0.02)
    box('cross', (1.9, 0.09, 0.08), (-1.6, 6.5, 0.885), mat('alu', '#c9c8c4', rough=0.3, metal=0.9), bevel=0.004)
    box('rip', (0.09, 1.3, 0.1), (0.95, 5.4, 0.88), mat('alu', '#c9c8c4', rough=0.3, metal=0.9), bevel=0.004)
    cyl('blade', 0.17, 0.004, (-0.5, 5.3, 0.82), mat('blade', '#c8c8c8', rough=0.18, metal=1), rot=(0, math.radians(90), 0))
    box('guard', (0.06, 0.5, 0.12), (-0.5, 5.3, 1.02), red, bevel=0.02)
    box('guard_arm', (1.4, 0.05, 0.05), (0.2, 5.3, 1.6), body)
    box('guard_post', (0.07, 0.07, 1.6), (0.9, 5.3, 0), body)
    box('sheet_on', (1.5, 2.3, 0.018), (-1.35, 5.3, 0.885), M('white_oak'))
    box('offcut', (0.7, 1.2, 0.018), (0.25, 5.5, 0.88), M('white_oak'))
    cyl('duct', 0.09, H - 1.7, (0.9, 5.9, 1.7), mat('duct', '#b5b3ad', rough=0.35, metal=0.8))
    _stack(-3.9, 4.2, 22, seed=0); _stack(-3.9, 6.0, 14, seed=2); _stack(3.4, 8.6, 18, seed=1)
    for k in range(9):
        box('board', (2.6, 0.018, 1.9), (-0.6, D - 0.35 - k * 0.045, 0.1), M(('greige', 'white_oak', 'graphite', 'ldsp_white')[k % 4]), rot=(math.radians(8), 0, 0))
    lib.camera((1.7, 2.9, 1.5), (-1.0, 5.7, 0.85), lens=27)
    return dict(exposure=-0.1)


def w_edge():
    """Кромление: станок и детали с кромкой."""
    W, D, H = _shop()
    body, steel, acc = mat('eb', '#e4e2dc', rough=0.4, metal=0.2), mat('alu', '#c9c8c4', rough=0.3, metal=0.9), mat('machine_r', '#b4623a', rough=0.5)
    box('eb_base', (4.6, 0.8, 0.85), (0.3, 6.6, 0), mat('machine_b', '#3b4a52', rough=0.5), bevel=0.02)
    box('eb_hood', (4.2, 0.55, 0.62), (0.5, 6.75, 0.9), body, bevel=0.04)
    box('eb_win', (3.2, 0.01, 0.3), (0.6, 6.47, 1.1), M('glass_black'))
    box('eb_stripe', (4.2, 0.012, 0.05), (0.5, 6.47, 0.93), acc)
    box('eb_track', (5.4, 0.22, 0.05), (0.2, 6.25, 0.86), steel, bevel=0.004)
    box('eb_panel', (0.4, 0.06, 0.5), (-1.8, 6.4, 1.1), mat('hmi', '#1c1d1c', rough=0.3), bevel=0.01)
    cyl('coil', 0.3, 0.03, (-2.4, 6.9, 0.9), M('white_oak'), verts=64)
    cyl('coil_hub', 0.06, 0.05, (-2.4, 6.9, 0.9), steel)
    box('part_in', (0.9, 0.5, 0.018), (-1.7, 6.0, 0.91), M('greige'))
    box('part_out', (0.9, 0.5, 0.018), (2.5, 6.0, 0.91), M('greige'))
    # тележка с готовыми деталями
    box('cart', (1.2, 0.7, 0.05), (2.6, 4.4, 0.25), mat('cartm', '#3b4a52', rough=0.5), bevel=0.01)
    for dx in (-0.5, 0.5):
        for dy in (-0.28, 0.28):
            cyl('wheel', 0.06, 0.04, (2.6 + dx, 4.4 + dy, 0.0), M('blackmetal'), rot=(math.radians(90), 0, 0))
    for k in range(14):
        box('part', (0.9 + (k % 3) * 0.1, 0.5 + (k % 2) * 0.1, 0.018), (2.6, 4.4, 0.3 + k * 0.019), M(('greige', 'graphite', 'white_oak')[k // 5 % 3]))
    _stack(-3.9, 5.0, 12, seed=3)
    lib.camera((3.5, 3.0, 1.45), (0.3, 6.5, 0.9), lens=28)
    return dict(exposure=-0.1)


def w_assembly():
    """Контрольная сборка: корпуса на сборочном столе, фасады на стойке."""
    W, D, H = _shop()
    oak = M('top_oak')
    box('bench', (3.2, 1.3, 0.05), (0.2, 5.6, 0.5), M('plywood'), bevel=0.004)
    for dx in (-1.4, 1.4):
        for dy in (-0.5, 0.5):
            box('bleg', (0.07, 0.07, 0.5), (0.2 + dx, 5.6 + dy, 0), M('blackmetal'))
    # корпуса без фасадов: видны полки и направляющие
    for i, (w, x) in enumerate(((0.6, -0.9), (0.8, -0.15), (0.6, 0.6))):
        m = M('ldsp_white')
        z0 = 0.55
        for dx in (-w / 2 + 0.009, w / 2 - 0.009):
            box('side', (0.018, 0.56, 0.76), (x + dx, 5.7, z0), m)
        box('bottom', (w, 0.56, 0.018), (x, 5.7, z0), m)
        box('rail_f', (w, 0.1, 0.018), (x, 5.47, z0 + 0.742), m)
        box('rail_b', (w, 0.1, 0.018), (x, 5.93, z0 + 0.742), m)
        box('backp', (w, 0.004, 0.76), (x, 5.98, z0), M('plywood'))
        if i == 1:
            box('shelf', (w - 0.04, 0.5, 0.018), (x, 5.72, z0 + 0.38), m)
        else:
            for k in range(3):
                box('drw', (w - 0.06, 0.5, 0.012), (x, 5.62 - (0.18 if k == 2 and i == 0 else 0), z0 + 0.06 + k * 0.24), M('graphite'))
                box('drw_f', (w - 0.06, 0.016, 0.1), (x, 5.37 - (0.18 if k == 2 and i == 0 else 0), z0 + 0.06 + k * 0.24), M('graphite'))
    box('drill', (0.2, 0.07, 0.2), (1.35, 5.3, 0.55), mat('drill', '#b4623a', rough=0.5), bevel=0.02)
    box('level', (0.8, 0.03, 0.06), (1.2, 5.9, 0.55), mat('level', '#d9a62b', rough=0.5), bevel=0.004)
    # стойка с фасадами
    for k in range(7):
        box('front', (0.6, 0.019, 0.72 + (k % 2) * 0.2), (-3.4 + k * 0.03, 7.2 + k * 0.09, 0.08), M(('sage', 'greige', 'graphite', 'white_oak')[k % 4]), bevel=0.001, rot=(math.radians(10), 0, math.radians(90)))
    box('rack', (0.9, 1.0, 0.08), (-3.4, 7.5, 0), M('plywood'))
    # готовая колонна у стены
    c = dict(front=M('greige'), handle='gola')
    r = Run('back', 1.8, D - 0.3, c)
    r.tall(0.6, 'oven', top=2.3); r.tall(0.6, 'fridge', top=2.3)
    _stack(3.9, 4.6, 10, seed=1)
    lib.camera((-1.7, 3.3, 1.45), (0.35, 5.8, 0.85), lens=30)
    return dict(exposure=-0.1)


# ───────────────────────── Материалы (крупные планы) ─────────────────────────

def _table_scene(top='plywood', W=3.0, D=2.4):
    H = 2.7
    kit.shell(W, D, H, wall='wall_plaster', floor='floor_oak', window=(1.3, 1.6, 0.9, 1.5), portal=90, sun=2.2)
    box('tbl', (2.6, 1.4, 0.04), (0, 1.5, 0.74), M(top), bevel=0.004)
    return 0.78


def m_facades():
    """Образцы фасадов веером."""
    z = _table_scene('walnut')
    keys = ('graphite', 'sage', 'white_oak', 'greige', 'navy', 'walnut', 'cream', 'terracotta', 'black_oak', 'white')
    for i, k in enumerate(keys):
        a = -0.5 + i * 0.11
        box('sample', (0.2, 0.3, 0.019), (-0.42 + i * 0.1, 1.42 + math.sin(i * 0.9) * 0.02, z + i * 0.0195), M(k), bevel=0.0015, rot=(0, 0, a))
    for i, k in enumerate(('oak', 'grey_oak', 'graphite')):
        box('sample_b', (0.3, 0.4, 0.019), (0.75, 1.7, z + i * 0.0195), M(k), bevel=0.0015, rot=(0, 0, 0.2 - i * 0.25))
    cyl('cup', 0.045, 0.08, (-0.75, 1.75, z), M('ceramic_w'), verts=48, bevel=0.006)
    lib.camera((0.05, 0.6, 1.4), (0.05, 1.45, 0.78), lens=36)
    return dict(exposure=0.35)


def m_tops():
    """Образцы столешниц."""
    z = _table_scene('white_oak')
    for i, (k, t) in enumerate((('marble', 0.03), ('quartz_grey', 0.03), ('compact_black', 0.012), ('top_oak', 0.04), ('quartz_white', 0.03), ('granite', 0.03))):
        x, y = -0.5 + (i % 3) * 0.42, 1.28 + (i // 3) * 0.36
        box('slab', (0.36, 0.3, t), (x, y, z), M(k), bevel=0.003, rot=(0, 0, (i - 2.5) * 0.04))
    kit.bowl(0.85, 1.75, z, fruit='#d9a12b', n=4)
    lib.camera((0.1, 0.5, 1.4), (-0.08, 1.45, 0.78), lens=36)
    return dict(exposure=0.35)


def m_hardware():
    """Выдвинутый ящик: направляющие, доводчики, органайзер."""
    W, D, H = 3.0, 2.6, 2.7
    kit.shell(W, D, H, wall='wall_plaster', floor='floor_oak', window=(1.3, 1.6, 0.9, 1.5), portal=100, sun=2.4)
    c = dict(front=M('graphite'), top=M('quartz_white'), handle='gola')
    r = Run('back', -1.2, D, c)
    r.base(0.6, 'drawers3'); r.base(0.9, 'panel'); r.base(0.6, 'doors2')
    r.top(0, r.u); r.splash(0, r.u)
    r.wall(0, (0.6, 0.9, 0.6))
    # выдвинутый ящик среднего модуля
    x, y0, z = -1.2 + 0.6 + 0.45, D - 0.58, PL + 0.42
    out = 0.42
    steel = M('steel')
    box('dr_bottom', (0.83, 0.5, 0.016), (x, y0 - out + 0.25, z), M('ldsp_white'))
    for dx in (-0.42, 0.42):
        box('dr_side', (0.014, 0.5, 0.16), (x + dx, y0 - out + 0.25, z), mat('legra', '#4a4b4c', rough=0.3, metal=0.9), bevel=0.002)
    box('dr_back', (0.83, 0.014, 0.16), (x, y0 - out + 0.5, z), mat('legra', '#4a4b4c', rough=0.3, metal=0.9))
    box('dr_front', (0.897, 0.019, 0.3), (x, y0 - out - 0.01, z - 0.04), M('graphite'), bevel=0.0012)
    for dx in (-0.435, 0.435):
        box('runner', (0.012, 0.5, 0.03), (x + dx, y0 - 0.1, z - 0.01), steel)
    # органайзер и посуда
    for dx in (-0.2, 0.08):
        box('div', (0.012, 0.44, 0.06), (x + dx, y0 - out + 0.25, z + 0.016), M('white_oak'))
    for i in range(4):
        for j in range(4):
            cyl('plate', 0.085, 0.01, (x + 0.27, y0 - out + 0.13 + i * 0.0 + 0.11 * (i % 2), z + 0.016 + (i * 4 + j) * 0.011), M('ceramic_w'), verts=40, bevel=0.003)
    for i in range(5):
        cyl('cup', 0.035, 0.07, (x - 0.31 + (i % 2) * 0.085, y0 - out + 0.08 + (i // 2) * 0.1, z + 0.016), M(('ceramic_d', 'ceramic_t', 'ceramic_w')[i % 3]), verts=32, bevel=0.005)
    for i in range(6):
        box('cutl', (0.018, 0.2, 0.006), (x - 0.12 + i * 0.03, y0 - out + 0.2, z + 0.016), steel, bevel=0.002)
    kit.boards(-0.95, D - 0.06, CT + TOP_T)
    lib.camera((0.55, 0.75, 1.5), (-0.2, y0 - 0.25, 0.62), lens=30)
    return dict(exposure=0.3)
