"""
Генерация фотографий для сайта (nano-banana-2.1, Gemini-совместимый API).
Запуск: IMG_API_KEY=... python3 scripts/gen-images.py <папка> [имя ...]   затем: npm run images <папка>
Для каждой кухни и мебели — основной кадр и два других ракурса того же интерьера (по опорному фото).
"""
import sys, json, base64, re, urllib.request, os, time
from concurrent.futures import ThreadPoolExecutor

K = os.environ['IMG_API_KEY']
URL = os.environ.get('IMG_API_URL', 'https://api-market1.shop/v1beta/models/nano-banana-2.1:generateContent')

STYLE = (" Photographed for a furniture maker's portfolio on a full-frame DSLR, 24mm lens, eye level, natural soft overcast northern daylight, "
         "true-to-life colours, realistic materials and small imperfections, slightly lived-in, wide landscape frame. Looks like a real photo of a real apartment, "
         "not a 3D render, not staged luxury. No people, no text, no logos, no watermarks.")
WIN = (" If a window is visible: white PVC frame, sheer tulle curtain; outside only overcast sky, birch trees and an ordinary five-storey grey brick or panel "
       "apartment block typical for Arkhangelsk, Russia. No skyscrapers, no skyline, no palm trees, no mountains.")
APT = " Ordinary Russian city apartment in Arkhangelsk, ceiling about 2.6 m, laminate or tile floor, painted walls."
NEW = " Modern new-build apartment in Arkhangelsk, kitchen-living room, ceiling 2.8 m."

P = {
 'hero': "Spacious custom-built kitchen-living room: matte graphite handleless cabinets up to the ceiling, tall columns with built-in oven in natural oak veneer, oak open niche with LED light, light quartz countertop and backsplash, kitchen island with three bar stools and black pendant lamps, engineered oak floor. Evening-ish soft light, warm under-cabinet lighting on." + NEW,
 'cta': "Close three-quarter view of a custom kitchen worktop zone: matte graphite handleless drawers with black Gola profile, light quartz countertop, oak veneer niche with ceramics, warm LED under-cabinet light, a wooden cutting board and a bowl of lemons. Shallow depth of field." + NEW,
 'k-modern': "Modern straight custom kitchen: warm greige matte handleless fronts, upper cabinets in two rows up to the ceiling, two tall columns in light oak with built-in oven and hidden fridge, white quartz countertop, hidden hood, induction hob, small dining table with two chairs." + NEW,
 'k-handleless': "Handleless L-shaped custom kitchen with black Gola aluminium profile: sage green matte fronts, white quartz countertop, white backsplash, tall oven column, upper cabinets to the ceiling, herringbone oak floor." + APT,
 'k-neoclassic': "Neoclassical custom kitchen: cream shaker-style framed MDF fronts painted in enamel, brass knob handles and brass tap, marble-look quartz countertop, decorative hood portal, cornice, glass display cabinet with warm light, herringbone parquet." + APT,
 'k-scandi': "Scandinavian custom kitchen: white matte fronts with small wooden knobs, solid oak countertop, open oak shelves with ceramics, white square tile backsplash, light laminate floor, small round dining table by the window." + APT,
 'k-loft': "Loft style custom kitchen: black matte fronts with black bar handles, dark oak countertop and island, open black metal shelves, grey concrete-look wall panel, black pendant lamps, three leather bar stools." + NEW,
 'k-corner': "Typical L-shaped corner custom kitchen in a 9 sq m kitchen of a panel building: graphite matte lower cabinets with steel bar handles, white upper cabinets, grey stone-look laminate countertop, white tile backsplash, built-in oven, sink under the window, ventilation box in the corner neatly boxed in." + APT,
 'k-straight': "Straight single-wall custom kitchen: all cabinets stand in one line along one solid wall about 3.2 m long with no window in that wall (the window is on the adjacent side wall on the left). Deep navy blue matte fronts, brass bar handles, white quartz countertop and backsplash, tall oven column at the left end, tall hidden fridge column at the right end, upper cabinets between them, oak laminate floor. Frontal three-quarter view." + APT,
 'k-island': "Light custom kitchen with an island: white handleless wall of tall cabinets, island in light oak veneer with marble-look waterfall countertop and induction hob, three bar stools, two linen pendant lamps, herringbone floor." + NEW,
 'k-small': "Very small 5.5 sq m kitchen in a khrushchyovka apartment with a compact custom corner kitchen: white handleless fronts up to the low ceiling, oak-look countertop continuing onto the window sill, narrow 45 cm built-in oven, two-burner hob, small sink, white tiles. Tight room, photographed from the doorway with a wide lens." + APT,
 'k-ceiling': "Custom kitchen with cabinets up to the ceiling: terracotta matte lower drawers, cream upper cabinets in two tiers reaching the ceiling, white quartz countertop, tall columns with built-in oven and microwave, handleless." + APT,
 'f-wardrobe': "Built-in sliding wardrobe wall to wall, floor to ceiling in a bedroom: three sliding doors, two in light oak laminate and one bronze mirror, slim black aluminium profiles. Part of a bed with linen bedding in the foreground." + APT,
 'f-closet': "Small walk-in closet with custom open storage system in light oak laminate: hanging rails with real clothes, shelves with folded sweaters, drawers, shoe shelves, LED strips, a pouf. No window.",
 'f-hall': "Narrow apartment hallway with custom-built furniture: tall greige wardrobe, open oak niche with bench and cushion, coat hooks with a winter parka, shoe shelf with boots, round mirror, tile floor." + APT.replace(' laminate or tile floor,', ''),
 'f-bath': "Bathroom with custom wall-hung vanity in oak veneer with white solid-surface top and vessel basin, black tap, round backlit mirror, tall cabinet, grey porcelain tiles, towels. No window.",
 'f-kids': "Children's room with custom loft bed in birch plywood and white, desk with shelves and books underneath, ladder, sage green wardrobe, yellow chair, rug." + APT,
 'f-living': "Living room TV zone with custom furniture: walnut slatted wall panel, wall-hung low greige cabinet, TV, open walnut shelving with books, hidden LED light, edge of a linen sofa in the foreground." + APT,
 'w-cut': "Inside a small real Russian furniture workshop: a sliding table panel saw cutting a laminated chipboard sheet, stacks of white and oak-look chipboard panels on pallets, dust extraction pipes, fluorescent lights, concrete floor, a bit dusty and used. Documentary photo, no people.",
 'w-edge': "Inside a small real Russian furniture workshop: an edge banding machine with a cabinet panel coming out, rolls of PVC edging, a trolley with stacked finished greige and oak panels with applied edges, fluorescent lights. Documentary photo, no people.",
 'w-assembly': "Inside a small real Russian furniture workshop: kitchen cabinet carcasses being assembled on a workbench, drawers with metal runners half installed, cordless screwdriver, clamps, finished fronts leaning on a rack, fluorescent lights. Documentary photo, no people.",
 'm-facades': "Top-down three-quarter photo of kitchen facade samples fanned out on a wooden table: matte graphite, sage green, cream, navy, terracotta painted MDF, oak and walnut veneer, a shaker-frame sample, a colour fan deck, natural window light, shallow depth of field.",
 'm-tops': "Photo of kitchen countertop samples laid on a table: white quartz, grey quartz, marble-look, black compact laminate 12 mm, oak butcher block, HPL laminate edge samples, natural window light, shallow depth of field.",
 'm-hardware': "Close-up photo of an open kitchen drawer with full-extension soft-close metal drawer box, wooden cutlery organiser, plates, in a matte graphite kitchen; visible hinge with soft-close on the neighbouring open door, natural light.",
}
NOSTYLE_WIN = ('f-closet', 'f-bath', 'w-cut', 'w-edge', 'w-assembly', 'm-facades', 'm-tops', 'm-hardware')
ANGLES = {
 2: "This is a reference photo of a real interior. Take another photo of exactly the same room and the same furniture — identical cabinets, colours, materials, handles, countertop, floor and window — but from the opposite side of the room at a three-quarter angle, so the composition clearly differs.",
 3: "This is a reference photo of a real interior. Take a close-up detail photo of exactly the same furniture — identical colours, materials and handles. Show a neat fragment at arm's length: closed fronts with precise even gaps, the countertop edge, and one drawer pulled open on metal soft-close runners with tidy contents. The furniture fills the whole frame; the window is not in the frame. Shallow depth of field, correct realistic construction.",
}


def call(prompt, out, ref=None):
    parts = [{'text': prompt}]
    if ref:
        parts.append({'inlineData': {'mimeType': 'image/jpeg', 'data': base64.b64encode(open(ref, 'rb').read()).decode()}})
    body = {'contents': [{'role': 'user', 'parts': parts}], 'generationConfig': {'responseModalities': ['IMAGE']}}
    for attempt in range(4):
        try:
            req = urllib.request.Request(f'{URL}?key={K}', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
            d = json.load(urllib.request.urlopen(req, timeout=400))
            for p in d['candidates'][0]['content']['parts']:
                data = p.get('inlineData', {}).get('data')
                m = re.search(r'data:image/\w+;base64,([A-Za-z0-9+/=]+)', p.get('text', ''))
                data = data or (m and m.group(1))
                if data:
                    open(out, 'wb').write(base64.b64decode(data))
                    return True
        except Exception as e:
            err = e
        time.sleep(4 + attempt * 6)
    print('✗', out, flush=True)
    return False


def one(name, outdir):
    base = f'{outdir}/{name}.jpg'
    prompt = P[name] + ('' if name in NOSTYLE_WIN else WIN) + STYLE
    if not os.path.exists(base) and not call(prompt, base):
        return
    print('✓', name, flush=True)
    if name[:2] in ('k-', 'f-'):
        for n, a in ANGLES.items():
            o = f'{outdir}/{name}-{n}.jpg'
            w = '' if (n == 3 or name in NOSTYLE_WIN) else WIN
            extra = ' The room has no window.' if name in ('f-bath', 'f-closet') else ''
            if os.path.exists(o) or call(a + extra + w + STYLE, o, base):
                print('✓', f'{name}-{n}', flush=True)


if __name__ == '__main__':
    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)
    names = sys.argv[2:] or list(P)
    with ThreadPoolExecutor(5) as ex:
        list(ex.map(lambda n: one(n, outdir), names))
