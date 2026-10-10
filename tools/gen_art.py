#!/usr/bin/env python3
"""Generates every texture of the Grand Line add-on as pixel art.

Run from the repo root:  python3 tools/gen_art.py  [--preview]
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from art_lib import (  # noqa: E402
    disc,
    fill_fn,
    get,
    hexc,
    hue_shift,
    line,
    mix,
    new,
    outline,
    put,
    radial_glow,
    rect,
    shade,
    stamp,
    upscale,
)
from model_defs import captain_bones, face_rects, humanoid_bones  # noqa: E402

ROOT = os.path.dirname(HERE)
RP = os.path.join(ROOT, "packs", "GrandLine_RP")
BP = os.path.join(ROOT, "packs", "GrandLine_BP")
TX = os.path.join(RP, "textures", "grandline")
SAVED = []


def save(img, rel):
    path = os.path.join(TX, rel) if not rel.startswith("/") else rel
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    SAVED.append((rel, img))


CLEAR = (0, 0, 0, 0)


# =============================================================================================
# Devil Fruits
# =============================================================================================

FRUITS = {
    # key: (base, swirl tone, stem colour, leaf kind)
    "gomu": ("#8D3FC4", 0.55, "#3F8A2E", "curl"),
    "mera": ("#F0761C", 0.6, "#7A3B12", "flame"),
    "hie": ("#8FD2EE", 0.66, "#E9FBFF", "crystal"),
    "goro": ("#F3C42A", 0.62, "#6B4A12", "bolt"),
    "gura": ("#EDE2C4", 0.7, "#6E4A2A", "plain"),
    "pika": ("#FFF0A0", 0.72, "#E6B43C", "star"),
}

LIGHT = (-0.52, -0.62, 0.59)


def fruit_mask(key):
    """Returns a function giving (inside, nx, ny) for each pixel of the fruit body."""
    if key == "gura":
        lumps = [(6.0, 10.0, 4.2), (10.4, 9.6, 4.3), (8.2, 6.6, 3.9), (8.3, 12.3, 3.6)]
    else:
        lumps = [(8.0, 9.4, 6.1)]

    def f(x, y):
        best = None
        for cx, cy, r in lumps:
            dx = (x + 0.5 - cx) / r
            dy = (y + 0.5 - cy) / (r * 0.97)
            d2 = dx * dx + dy * dy
            if d2 <= 1.0 and (best is None or d2 < best[0]):
                best = (d2, dx, dy)
        if best is None:
            return None
        return best[1], best[2]

    return f


def swirl_value(x, y, centers, spacing=2.6, width=0.95):
    best = 1e9
    hit = False
    for cx, cy, turn in centers:
        dx = x + 0.5 - cx
        dy = y + 0.5 - cy
        r = math.hypot(dx, dy)
        if r > 3.3:
            continue
        th = math.atan2(dy, dx) * turn
        v = (r - spacing * (th / (2 * math.pi))) % spacing
        if r < best:
            best = r
            hit = v < width
    return hit


CURL_A = [".dd.", "d..d", "d.d.", ".d.."]
CURL_B = [".dd.", "d..d", ".d.d", "..d."]


def devil_fruit(key):
    base_hex, swirl_tone, stem_hex, leaf = FRUITS[key]
    base = hexc(base_hex)
    img = new(16, 16)
    mask = fruit_mask(key)
    for y in range(16):
        for x in range(16):
            m = mask(x, y)
            if not m:
                continue
            nx, ny = m
            nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny))
            diff = max(0.0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2])
            c = shade(base, 0.6 + 0.6 * diff)
            if nx > 0.55 and ny > 0.35:
                c = shade(c, 0.85)
            put(img, x, y, c)
    # the iconic swirls
    curls = [(3, 6, CURL_A), (9, 5, CURL_B), (6, 10, CURL_B), (11, 10, CURL_A)]
    if key == "gura":
        curls = [(3, 8, CURL_A), (9, 7, CURL_B), (6, 4, CURL_A), (7, 11, CURL_B)]
    for (cx, cy, pat) in curls:
        for j, row in enumerate(pat):
            for i, ch in enumerate(row):
                if ch != "d":
                    continue
                x, y = cx + i, cy + j
                under = get(img, x, y)
                if under[3]:
                    put(img, x, y, shade(under, swirl_tone))
                    hl = get(img, x - 1, y - 1)
                    if hl[3] and (i == 0 or j == 0) and (x + y) % 2 == 0:
                        put(img, x - 1, y - 1, shade(hl, 1.12))
    # specular highlight
    hl = mix(shade(base, 1.6), (255, 255, 255, 255), 0.55)
    for (x, y) in ([(4, 5), (5, 4), (4, 6)] if key != "gura" else [(7, 3), (8, 3), (3, 8)]):
        if get(img, x, y)[3]:
            put(img, x, y, hl)
    outline(img, shade(base, 0.3))
    # stem and leaf
    stem = hexc(stem_hex)
    top = 3 if key != "gura" else 2
    stamp(img, 7, top - 2, [".s", "s.", "s."], {"s": stem})
    if leaf == "curl":
        stamp(img, 8, 0, ["..ll", ".lLl", "ll.."], {"l": hexc("#3F9A35"), "L": hexc("#7FD36A")})
        stamp(img, 5, 0, ["c..", ".c."], {"c": stem})
    elif leaf == "flame":
        stamp(img, 8, 0, ["..y.", ".yoy", "yoo."], {"y": hexc("#FFE45C"), "o": hexc("#FF8A1E")})
    elif leaf == "crystal":
        stamp(img, 8, 0, [".w..", "wbw.", ".w.."], {"w": hexc("#FFFFFF"), "b": hexc("#7ED4F5")})
    elif leaf == "bolt":
        stamp(img, 8, 0, ["..yy", ".yy.", "yyy."], {"y": hexc("#FFF27A")})
    elif leaf == "star":
        stamp(img, 9, 0, [".w.", "wyw", ".w."], {"w": hexc("#FFFFFF"), "y": hexc("#FFE45C")})
    else:
        stamp(img, 8, 0, ["ll.", ".ll"], {"l": hexc("#4E7A2E")})
    return img


# =============================================================================================
# Skill icons: a framed "ability card" tinted by fruit, with a symbol.
# =============================================================================================

FRUIT_TINT = {"gomu": "#7A2FB0", "mera": "#C2410C", "hie": "#2A84B8", "goro": "#B88A08", "gura": "#6B6458", "pika": "#C9A227"}


def frame(key):
    tint = hexc(FRUIT_TINT[key])
    img = new(16, 16)
    for y in range(16):
        for x in range(16):
            corner = (x in (0, 15) and y in (0, 15))
            if corner:
                continue
            edge = x in (0, 15) or y in (0, 15)
            t = y / 15
            c = mix(shade(tint, 0.55), shade(tint, 0.25), t)
            if edge:
                c = shade(tint, 1.25)
            elif x in (1, 14) or y in (1, 14):
                c = shade(tint, 0.4)
            put(img, x, y, c)
    return img


def skill_icon(key, n):
    img = frame(key)
    W = hexc("#FFFFFF")
    S = hexc("#F2C49B")
    Sd = hexc("#C98F62")
    R = hexc("#FF3B1F")
    O = hexc("#FF9A1F")
    Y = hexc("#FFE45C")
    C = hexc("#BFF3FF")
    B = hexc("#5CC8F0")
    K = hexc("#20160F")
    G = hexc("#8C8C8C")
    P = hexc("#FFB6E6")
    sym = {
        ("gomu", 1): (["..............", "..............", "..........SSS.", ".........SSSSS", "SSSSSSSSSSSdSS", "dddddddddSSdSS", ".........SSSSS", "..........SSS.", "..............", "..............", "..............", ".............."], {"S": S, "d": Sd}),
        ("gomu", 2): (["..SS....SS....", ".SSSS..SSSS...", ".SSSS..SSSS...", "..SS....SS....", ".....SS....SS.", "....SSSS..SSSS", "....SSSS..SSSS", ".....SS....SS.", ".SS....SS.....", "SSSS..SSSS....", "SSSS..SSSS....", ".SS....SS....."], {"S": S}),
        ("gomu", 3): (["...ww....ww...", "..wwww..wwww..", "...ww....ww...", "....PPPPPP....", "...PPPPPPPP...", "...PP....PP...", ".........PP...", ".......PPP....", ".....PPP......", "...PPP........", "...PPPPPPPP...", "...PPPPPPPP..."], {"w": W, "P": P}),
        ("mera", 1): (["......Y..Y....", ".....YOY.OY...", "....YOOOYOOY..", "...YOROOOOROY.", "..YORRROORRROY", ".YORRSSSSRRROY", "YORRSSSSSSRRO.", ".ORRSSdSSSRRO.", "..ORSSSSSSRO..", "...ORRRRRRO...", "....OOOOOO....", ".............."], {"Y": Y, "O": O, "R": R, "S": S, "d": Sd}),
        ("mera", 2): (["..............", "......Y.......", ".....YOY......", "....YOROY.....", "YYY..YOY..Y...", "OOOY..Y..YOY..", "RROOY....YROY.", "OOOY......YOY.", "YYY........Y..", "..............", "..............", ".............."], {"Y": Y, "O": O, "R": R}),
        ("mera", 3): (["......YY......", ".....YOOY.....", "....YORROY....", "....ORRRRO....", "...YORRRROY...", "...ORRYYRRO...", "...ORYWWYRO...", "..YORYWWYROY..", "..ORRYYYYRRO..", ".YORRRRRRRROY.", "YOOOOOOOOOOOOY", "OOOOOOOOOOOOOO"], {"Y": Y, "O": O, "R": R, "W": W}),
        ("hie", 1): (["...........WC.", "..........WCB.", ".........WCB..", "....WC..WCB...", "...WCB.WCB....", "..WCB.WCB.....", ".WCB.WCB...WC.", ".CB.WCB...WCB.", "...WCB...WCB..", "...CB....CB...", "..............", ".............."], {"W": W, "C": C, "B": B}),
        ("hie", 2): (["......W.......", "...W..W..W....", "....W.W.W.....", ".....WCW......", "WWWWWCBCWWWWW.", ".....WCW......", "....W.W.W.....", "...W..W..W....", "......W.......", "..............", "BBBBBBBBBBBBBB", "CCCCCCCCCCCCCC"], {"W": W, "C": C, "B": B}),
        ("hie", 3): (["..WWWWWWWWWW..", ".WCCCCCCCCCCB.", ".WCCCCKKCCCCB.", ".WCCCKKKKCCCB.", ".WCCCCKKCCCCB.", ".WCCCKKKKCCCB.", ".WCCKCKKCKCCB.", ".WCCCCKKCCCCB.", ".WCCCKCCKCCCB.", ".WCCCKCCKCCCB.", ".BBBBBBBBBBBB.", ".............."], {"W": W, "C": C, "B": B, "K": hexc("#3B6E8C")}),
        ("goro", 1): (["...GGGGGGG....", ".GGGWWWWWGGG..", "GGWWWWWWWWWGG.", ".GGGGYGGGGGG..", ".....YY.......", "......YY......", ".....YY.......", "....YY........", ".....YY.......", "......YYY.....", ".....YYYYY....", "....WWWWWWW..."], {"G": G, "W": W, "Y": Y}),
        ("goro", 2): (["..Y.......Y...", "...Y.....Y....", "....YYYYY.....", "...YWWWWWY....", "YYYWWYYYWWYYYY", "...YWWWWWY....", "....YYYYY.....", "...Y.....Y....", "..Y.......Y...", ".Y.........Y..", "..............", ".............."], {"Y": Y, "W": W}),
        ("goro", 3): (["...........YY.", "..........YYY.", ".........YYY..", "....YYYYYYY...", "...YYYYYYY....", "......YYY.....", ".....YYY......", "....YYYYYYYY..", "...YYYYYYYY...", "......YYY.....", ".....YY.......", "....Y........."], {"Y": Y}),
        ("gura", 1): (["W.......W....W", ".W.....W....W.", "..W...SSS..W..", "...W.SSSSSW...", "WWWWWSSdSSWWWW", "....WSSdSS....", "....SSSSSW....", "...W.SSS..W...", "..W.......W...", ".W.........W..", "W...........W.", ".............."], {"W": W, "S": S, "d": Sd}),
        ("gura", 2): (["......W.......", "..W...W...W...", "...W..W..W....", "....W.W.W.....", "..............", "WWW.W....W.WWW", "..............", ".KK.KKK.KKK.KK", "KKGKKGGKKGGKKG", "GGKGGGKGGGKGGG", "GKGGKGGGKGGKGG", "GGGGGGGGGGGGGG"], {"W": W, "K": K, "G": G}),
        ("gura", 3): (["..............", "W.....W.....W.", ".W.....W.....W", "..W.....W.....", "..W.....W.....", "..W.....W.....", ".W.....W.....W", "W.....W.....W.", "..............", "GGGGGGGGGGGGGG", "GKGGKGGGKGGGKG", ".............."], {"W": W, "G": G, "K": K}),
        ("pika", 1): (["W.....W...Y...", ".Y.......W...W", "...W..Y.......", "Y.....W....Y..", "...Y......W...", ".W....Y.......", "....W....W..Y.", "Y.......Y.....", "...W.Y.....W..", ".Y......W.....", "....Y.......Y.", "W.......W....."], {"W": W, "Y": Y}),
        ("pika", 2): (["............YW", "...........YWY", "..........YWY.", ".........YWY..", "........YWY...", ".......YWY....", "......YWY.....", ".....YWY......", "..K.YWY.......", "...KWY........", "..KKK.........", ".KK..K........"], {"W": W, "Y": Y, "K": hexc("#8A6A14")}),
        ("pika", 3): (["......W.......", "..Y...W...Y...", "...Y..W..Y....", ".....YYY......", "....YWWWY.....", "WWWYWWWWWYWWW.", "....YWWWY.....", ".....YYY......", "...Y..W..Y....", "..Y...W...Y...", "......W.......", ".............."], {"W": W, "Y": Y}),
    }
    rows, pal = sym[(key, n)]
    stamp(img, 1, 2, rows, pal)
    return img


# =============================================================================================
# Haki + misc items
# =============================================================================================

def haki_icon(kind, size=16):
    img = new(16, 16)
    if kind == "armament":
        K = hexc("#15101C")
        P = hexc("#4B2E73")
        H = hexc("#B79BEA")
        stamp(img, 2, 2, [
            "....KKKK....",
            "...KPPPPK...",
            "..KKKKKKKK..",
            ".KPKPKPKPPK.",
            ".KPKPKPKPPK.",
            ".KHKHKHKPPKK",
            ".KKKKKKKPPPK",
            ".KPPPPPPPPKK",
            ".KPPPPPPPPK.",
            "..KPPPPPPK..",
            "..KKKKKKKK..",
            "...KPPPPK...",
        ], {"K": K, "P": P, "H": H})
        for (x, y) in [(13, 2), (14, 4), (1, 10)]:
            put(img, x, y, hexc("#C9A8FF"))
    elif kind == "observation":
        D = hexc("#0D2A3A")
        C = hexc("#4FC3F7")
        W = hexc("#E8FBFF")
        B = hexc("#0B5C8A")
        stamp(img, 0, 4, [
            "......DDDD......",
            "...DDDCCCCDDD...",
            ".DDCCWWBBWWCCDD.",
            "DCCWWBBDDBBWWCCD",
            ".DDCCWWBBWWCCDD.",
            "...DDDCCCCDDD...",
            "......DDDD......",
        ], {"D": D, "C": C, "W": W, "B": B})
        for (x, y) in [(2, 1), (7, 0), (13, 1), (2, 14), (8, 15), (13, 14)]:
            put(img, x, y, C)
    elif kind == "conqueror":
        G = hexc("#F5C542")
        g = hexc("#A8790F")
        R = hexc("#E53935")
        r = hexc("#FF8A80")
        K = hexc("#1A0508")
        stamp(img, 1, 4, [
            "..R....R....R..",
            ".GrG..GrG..GrG.",
            ".GGG..GGG..GGG.",
            ".GGGGGGGGGGGGG.",
            ".GgGGGgRgGGGgG.",
            ".GGGGGGGGGGGGG.",
            ".ggggggggggggg.",
        ], {"G": G, "g": g, "R": R, "r": r})
        outline(img, K)
        for (x, y) in [(0, 1), (1, 2), (0, 3), (15, 1), (14, 2), (15, 3), (2, 13), (3, 14), (2, 15), (13, 13), (12, 14), (13, 15), (7, 13), (8, 14), (7, 15)]:
            put(img, x, y, R)
    if size != 16:
        img = upscale(img, size // 16)
    return img


def codex():
    img = new(16, 16)
    R = hexc("#7A1018")
    r = hexc("#B3202B")
    G = hexc("#F2C14E")
    P = hexc("#F4EAD2")
    K = hexc("#2A0A0D")
    stamp(img, 2, 1, [
        "KKKKKKKKKKK.",
        "KrrrrrrrrrKP",
        "KrGGGGGGGrKP",
        "KrG..Y..GrKP",
        "KrG.YYY.GrKP",
        "KrGYYRYYGrKP",
        "KrG.YYY.GrKP",
        "KrG..Y..GrKP",
        "KrG.....GrKP",
        "KrGYYYYYGrKP",
        "KrGGGGGGGrKP",
        "KrrrrrrrrrKP",
        "KRRRRRRRRRKP",
        "KKKKKKKKKKKP",
    ], {"K": K, "r": r, "R": hexc("#E53935"), "G": G, "Y": hexc("#FFD95A"), "P": P, ".": r})
    return img


def treasure():
    img = new(16, 16)
    W = hexc("#7A4A22")
    w = hexc("#A8693A")
    I = hexc("#4A4A55")
    G = hexc("#FFD24A")
    g = hexc("#C9961E")
    K = hexc("#2A160A")
    stamp(img, 1, 3, [
        "...GgGG.G.....",
        "..GGGGgGGG....",
        ".KKKKKKKKKKKK.",
        "KwwIwwwwwwIwwK",
        "KWWIWWWWWWIWWK",
        "KIIIIIGGIIIIIK",
        "KwwIwwGgwwIwwK",
        "KWWIWWWWWWIWWK",
        "KwwIwwwwwwIwwK",
        "KWWIWWWWWWIWWK",
        "KKKKKKKKKKKKKK",
    ], {"W": W, "w": w, "I": I, "G": G, "g": g, "K": K})
    put(img, 13, 2, hexc("#FFFFFF"))
    return img


def jolly_roger():
    img = new(16, 16)
    P = hexc("#6B4A2A")
    K = hexc("#121212")
    k = hexc("#2A2A2A")
    W = hexc("#F2F2E8")
    R = hexc("#C21B1B")
    stamp(img, 1, 0, [
        "P.............",
        "PKKKKKKKKKKKK.",
        "PKkKKKKKKKKkKK",
        "PKKKRRRRRKKKKK",
        "PKKRWWWWWRKKKK",
        "PKKWWKWKWWKKKK",
        "PKKWWWWWWWKKKK",
        "PKKKWKWKWKKKKK",
        "PKWKKKKKKKWKKK",
        "PKKWKKKKKWKKKK",
        "PKKKWKKKWKKKKK",
        "PKKWKKKKKWKKK.",
        "PKWKKKKKKKWK..",
        "PKKKKKKKKKK...",
        "P.............",
        "P.............",
    ], {"P": P, "K": K, "k": k, "W": W, "R": R})
    return img


def seastone(kind):
    img = new(16, 16)
    T = hexc("#3E8C9C")
    t = hexc("#2A5E6A")
    L = hexc("#9FE3EE")
    K = hexc("#16313A")
    if kind == "raw":
        stamp(img, 3, 4, [
            "...KKKK...",
            "..KtTTTK..",
            ".KtTLTTtK.",
            "KtTTTTLTtK",
            "KTTLTTTTtK",
            "KtTTTtTTTK",
            ".KtTTTTtK.",
            "..KKtttK..",
            "....KKK...",
        ], {"K": K, "t": t, "T": T, "L": L})
    elif kind == "ingot":
        stamp(img, 1, 5, [
            "....KKKKKKKK..",
            "...KLLLLLLLTK.",
            "..KLTTTTTTTtK.",
            ".KLTTTTTTTtK..",
            "KTTTTTTTTtK...",
            "KttttttttK....",
            "KKKKKKKKK.....",
        ], {"K": K, "t": t, "T": T, "L": L})
    elif kind == "cuffs":
        for cx in (5, 11):
            disc(img, cx, 9, 3.6, lambda x, y, d: (T if d > 2.2 else None))
            disc(img, cx - 0.6, 8.4, 3.0, lambda x, y, d: (L if 2.4 < d < 2.9 and x < 9 else None))
        rect(img, 7, 8, 3, 1, hexc("#8A8A95"))
        outline(img, K)
    elif kind == "jitte":
        W = hexc("#5B3A20")
        line(img, 3, 13, 12, 4, T)
        line(img, 4, 13, 13, 4, t)
        line(img, 12, 4, 13, 3, L)
        stamp(img, 6, 6, ["T..", ".T.", "..T"], {"T": T})
        line(img, 1, 15, 4, 12, W)
        line(img, 2, 15, 5, 12, shade(W, 1.3))
        stamp(img, 4, 11, ["KK", "KK"], {"K": hexc("#C9A227")})
        outline(img, K)
    return img


def katana(blade_hex, edge_hex, hilt_hex, guard_hex):
    img = new(16, 16)
    B = hexc(blade_hex)
    E = hexc(edge_hex)
    H = hexc(hilt_hex)
    h = shade(H, 0.6)
    G = hexc(guard_hex)
    for i in range(10):
        x = 5 + i
        y = 10 - i
        put(img, x, y, B)
        put(img, x - 1, y, E)
        if i < 9:
            put(img, x, y - 1, shade(B, 0.8) if i % 3 else B)
    put(img, 15, 0, E)
    stamp(img, 2, 9, ["..G.", ".GGG", "GGG.", ".G.."], {"G": G})
    for i in range(4):
        put(img, 3 - i + 0, 12 + i - 1, H if i % 2 == 0 else h)
        put(img, 4 - i, 12 + i, h if i % 2 == 0 else H)
    outline(img, hexc("#101010"))
    return img


def seastone_ore():
    rng = random.Random(7)
    img = new(16, 16)
    stone = [hexc("#7A7A7A"), hexc("#6E6E6E"), hexc("#868686"), hexc("#737373")]
    for y in range(16):
        for x in range(16):
            put(img, x, y, rng.choice(stone))
    T = hexc("#3E9CAE")
    L = hexc("#A8F0FA")
    D = hexc("#1F5866")
    for (cx, cy) in [(4, 4), (11, 6), (6, 11), (12, 12)]:
        stamp(img, cx - 2, cy - 2, [".DTD.", "DTLTD", "TLLTT", "DTTTD", ".DTD."], {"D": D, "T": T, "L": L})
    return img


# =============================================================================================
# Entity skins
# =============================================================================================

def paint_cube(img, c, painter):
    """painter(face, u, v, w, h) -> color or None, called for each pixel of each face."""
    for face, (x, y, w, h) in face_rects(c).items():
        for v in range(h):
            for u in range(w):
                col = painter(face, u, v, w, h)
                if col is not None:
                    put(img, x + u, y + v, col)


def cube_of(bones, bone, idx=0):
    for b in bones:
        if b["name"] == bone:
            return b["cubes"][idx]
    raise KeyError(bone)


def noisy(c, rng, amt=0.06):
    return shade(c, 1 + rng.uniform(-amt, amt))


def skin_face(img, bones, skin, hair, eyes, mouth, beard=None, scar=False, hair_style="short", headwear=None):
    rng = random.Random(hash(skin) & 0xffff)
    head = cube_of(bones, "head")

    def painter(face, u, v, w, h):
        base = noisy(skin, rng, 0.03)
        if face == "top":
            return noisy(hair, rng)
        if face == "bottom":
            return shade(skin, 0.8)
        if face in ("right", "left", "back"):
            if v < (3 if hair_style == "short" else 5) or (face == "back" and v < (5 if hair_style == "short" else 8)):
                return noisy(hair, rng)
            if beard and v >= 6 and face != "back":
                return noisy(beard, rng)
            return shade(base, 0.92)
        # front
        if v <= 1:
            return noisy(hair, rng)
        if v == 2 and (u <= 1 or u >= 6 or (hair_style == "bangs" and u % 3 == 0)):
            return noisy(hair, rng)
        if v == 3 and (u == 0 or u == 7):
            return noisy(hair, rng)
        if v == 4:
            if u in (1, 2):
                return (255, 255, 255, 255) if u == 1 else eyes
            if u in (5, 6):
                return eyes if u == 5 else (255, 255, 255, 255)
            if u in (3, 4):
                return shade(skin, 0.9)
        if v == 3 and u in (1, 2, 5, 6):
            return shade(hair, 0.8)
        if v == 5 and u in (3, 4):
            return shade(skin, 0.82)
        if beard and v >= 6:
            if v == 6 and u in (3, 4):
                return mouth
            return noisy(beard, rng)
        if v == 6 and u in (3, 4):
            return mouth
        return base

    paint_cube(img, head, painter)
    if scar:
        x, y, w, h = face_rects(head)["front"]
        sc = hexc("#8E2B22")
        for i in range(3):
            put(img, x + 5 + (i % 2), y + 3 + i, sc)
        put(img, x + 7, y + 3, sc)
    if headwear:
        headwear(img, bones)


def paint_humanoid(img, bones, outfit):
    """outfit: dict of bone -> painter function."""
    for b in bones:
        for i, c in enumerate(b.get("cubes", [])):
            p = outfit.get(b["name"])
            if p:
                paint_cube(img, c, p)


def captain_texture():
    bones = captain_bones()
    img = new(128, 64)
    rng = random.Random(42)
    skin = hexc("#D9A47A")
    hair = hexc("#A8121A")
    shirt = hexc("#ECE6DA")
    shirt_d = hexc("#C9C1B0")
    coat = hexc("#17131A")
    coat_l = hexc("#2A2230")
    lining = hexc("#8E0E14")
    gold = hexc("#E3B341")
    gold_d = hexc("#9C7418")
    pants = hexc("#1E1B24")
    boot = hexc("#3A2416")
    sash = hexc("#9B1B1F")

    skin_face(img, bones, skin, hair, hexc("#2B0B0B"), hexc("#7A3B2C"), beard=None, scar=True, hair_style="bangs")

    def body(face, u, v, w, h):
        if face in ("top", "bottom"):
            return noisy(coat if face == "top" else pants, rng)
        if face == "front":
            # open coat over a white shirt, red sash, gold buckle
            if v >= 8 and v <= 9:
                if u in (3, 4):
                    return gold if v == 8 else gold_d
                return noisy(sash, rng)
            if u <= 1 or u >= 6:
                return noisy(coat_l if u in (1, 6) else coat, rng)
            if v <= 2 and u in (3, 4):
                return noisy(skin, rng, 0.03)
            return noisy(shirt if (u + v) % 5 else shirt_d, rng, 0.03)
        if face == "back":
            return noisy(coat, rng)
        return noisy(coat_l if v < 8 else coat, rng)

    def arm(face, u, v, w, h):
        if face == "top":
            return noisy(shirt, rng)
        if face == "bottom":
            return skin
        if v < 6:
            return noisy(shirt if v != 5 else shirt_d, rng, 0.03)
        if v == 6:
            return shirt_d
        return noisy(skin, rng, 0.04)

    def leg(face, u, v, w, h):
        if face == "top":
            return pants
        if face == "bottom":
            return shade(boot, 0.7)
        if v >= 7:
            if v == 7:
                return shade(boot, 1.3)
            return noisy(boot, rng)
        return noisy(pants, rng)

    def clear(face, u, v, w, h):
        return CLEAR

    def jacket(face, u, v, w, h):
        # coat shoulders + side panels over the shirt
        if face == "front":
            if u == 0 or u == w - 1:
                return gold if v < 11 else gold_d
            return CLEAR
        if face == "top":
            return noisy(coat, rng)
        if face in ("right", "left"):
            return noisy(coat if v > 0 else gold, rng)
        if face == "back":
            return noisy(coat, rng)
        return CLEAR

    def coatpart(face, u, v, w, h):
        if face == "front":  # faces the player's back (inside lining)
            return noisy(lining, rng, 0.08)
        if face == "back":  # outside of the coat
            if v >= h - 2:
                return gold if v == h - 2 else gold_d
            if u == 0 or u == w - 1:
                return gold_d
            # crimson skull and crossbones
            crest = [
                "...rrrr...",
                "..rrrrrr..",
                "..rKrrKr..",
                "..rrrrrr..",
                "...rKKr...",
                "r..rrrr..r",
                ".r......r.",
                "..r....r..",
                "...r..r...",
                "....rr....",
                "...r..r...",
                "..r....r..",
                ".r......r.",
            ]
            if 3 <= v < 3 + len(crest) and w >= 10:
                ch = crest[v - 3][u] if u < 10 else "."
                if ch == "r":
                    return shade(lining, 1.35)
                if ch == "K":
                    return coat
            return noisy(coat, rng)
        if face in ("right", "left"):
            return gold_d
        return noisy(coat, rng)

    def collar(face, u, v, w, h):
        if face == "front":
            if 2 <= u <= w - 3:
                return CLEAR
            return noisy(coat_l, rng)
        if face == "top":
            return noisy(coat, rng) if v not in (1, 2, 3) or u < 2 or u > w - 3 else CLEAR
        if face == "bottom":
            return CLEAR
        return noisy(lining if v == 0 else coat, rng)

    def epaulette(face, u, v, w, h):
        if face == "top":
            return gold if (u + v) % 2 else shade(gold, 1.15)
        if face == "bottom":
            return gold_d
        return gold_d if v == 1 else gold

    def hatcrown(face, u, v, w, h):
        if face == "top":
            return noisy(coat, rng)
        if face == "bottom":
            return CLEAR
        if face == "front":
            # skull emblem
            sk = ["..WWW..", ".WKWKW.", ".WWWWW.", "..W.W.."]
            if 0 <= v - 0 < 3 and 1 <= u < 8:
                row = sk[v] if v < len(sk) else ""
                ch = row[u - 1] if u - 1 < len(row) else "."
                if ch == "W":
                    return hexc("#EFEFE6")
                if ch == "K":
                    return coat
            return noisy(coat, rng)
        return noisy(coat, rng)

    def hatbrim(face, u, v, w, h):
        if face in ("top", "bottom"):
            # rounded corners
            if (u in (0, w - 1)) and (v in (0, h - 1)):
                return CLEAR
            if u == 0 or u == w - 1 or v == 0 or v == h - 1:
                return gold if face == "top" else gold_d
            return noisy(coat_l if face == "top" else coat, rng)
        return gold

    outfit = {
        "body": body, "rightArm": arm, "leftArm": arm, "rightLeg": leg, "leftLeg": leg,
        "jacket": jacket, "rightSleeve": clear, "leftSleeve": clear, "rightPants": clear, "leftPants": clear,
        "hat": clear, "coat": coatpart, "collar": collar, "rightEpaulette": epaulette, "leftEpaulette": epaulette,
        "hatCrown": hatcrown, "hatBrim": hatbrim,
    }
    paint_humanoid(img, bones, outfit)

    # glowing eyes layer
    eyes = new(128, 64)
    x, y, w, h = face_rects(cube_of(bones, "head"))["front"]
    for ex in (1, 2, 5, 6):
        put(eyes, x + ex, y + 4, hexc("#FF2A2A"))
    put(eyes, x + 1, y + 3, hexc("#FF2A2A", 150))
    put(eyes, x + 6, y + 3, hexc("#FF2A2A", 150))
    return img, eyes


def pirate_texture(kind):
    bones = humanoid_bones()
    img = new(64, 64)
    rng = random.Random(len(kind) * 31)
    if kind == "brawler":
        skin, hair, eyes = hexc("#C68B5E"), hexc("#3A2612"), hexc("#1A1A1A")
        top, top2, pants, boot = hexc("#F2F2F2"), hexc("#2B4A8C"), hexc("#5A4630"), hexc("#2B1D12")
        band = hexc("#C21B1B")
    elif kind == "gunner":
        skin, hair, eyes = hexc("#E2B48A"), hexc("#7A5A2A"), hexc("#1A2A3A")
        top, top2, pants, boot = hexc("#2F5D3A"), hexc("#1E3B25"), hexc("#3B3B45"), hexc("#1B1B1F")
        band = hexc("#2A2A2A")
    else:
        skin, hair, eyes = hexc("#D8A06E"), hexc("#1A1210"), hexc("#3A1A00")
        top, top2, pants, boot = hexc("#141414"), hexc("#F07818"), hexc("#3A2A1A"), hexc("#2B1A10")
        band = hexc("#F07818")

    skin_face(img, bones, skin, hair, eyes, hexc("#6A3A2A"), beard=hexc("#3A2612") if kind == "gunner" else None,
              hair_style="bangs" if kind == "flame" else "short")

    def body(face, u, v, w, h):
        if face in ("top", "bottom"):
            return top
        if kind == "brawler":
            return noisy(top if v % 2 == 0 else top2, rng, 0.03)  # striped sailor shirt
        if kind == "gunner":
            if face == "front" and u in (3, 4):
                return hexc("#C9A227") if v % 3 == 1 else top2
            if v == 8:
                return hexc("#5A3A1A")
            return noisy(top, rng)
        # flame: open black vest, bare chest with a fire tattoo
        if face == "front":
            if u <= 1 or u >= 6:
                return noisy(top, rng)
            if v in (4, 5) and u in (3, 4):
                return top2
            if v == 6 and u in (2, 5):
                return top2
            if v == 9:
                return hexc("#5A3A1A")
            return noisy(skin, rng, 0.03)
        return noisy(top, rng)

    def arm(face, u, v, w, h):
        if face == "top":
            return top
        if kind == "brawler" and v < 4:
            return noisy(top if v % 2 == 0 else top2, rng, 0.03)
        if kind == "gunner" and v < 9:
            return noisy(top, rng)
        if kind == "flame" and v == 3 and face == "front":
            return top2
        return noisy(skin, rng, 0.04)

    def leg(face, u, v, w, h):
        if v >= 8:
            return noisy(boot, rng)
        return noisy(pants, rng)

    def hat(face, u, v, w, h):
        # bandana / headwrap on the hat layer
        if face == "top":
            return noisy(band, rng) if kind != "gunner" else noisy(band, rng)
        if face == "bottom":
            return CLEAR
        if v <= 2:
            if kind == "brawler" and (u + v) % 3 == 0:
                return hexc("#F2F2F2")
            return noisy(band, rng)
        if face == "back" and v <= 4 and u in (3, 4):
            return noisy(band, rng)
        return CLEAR

    def clear(face, u, v, w, h):
        return CLEAR

    outfit = {"body": body, "rightArm": arm, "leftArm": arm, "rightLeg": leg, "leftLeg": leg,
              "hat": hat, "jacket": clear, "rightSleeve": clear, "leftSleeve": clear, "rightPants": clear, "leftPants": clear}
    paint_humanoid(img, bones, outfit)
    if kind == "brawler":
        # eyepatch
        x, y, w, h = face_rects(cube_of(bones, "head"))["front"]
        put(img, x + 5, y + 4, hexc("#111111"))
        put(img, x + 6, y + 4, hexc("#111111"))
        line(img, x, y + 3, x + 7, y + 3, hexc("#111111"))
    return img


def rubber_fist():
    img = new(32, 32)
    skin = hexc("#F2C49B")
    d = hexc("#C98F62")
    rng = random.Random(3)
    for y in range(32):
        for x in range(32):
            put(img, x, y, shade(skin, 1 + rng.uniform(-0.04, 0.04)))
    # knuckle lines on the front face (uv 6,6 size 6x6)
    for i in range(4):
        put(img, 6 + 1 + i, 6 + 1, d)
        put(img, 6 + 1 + i, 6 + 3, d)
    return img


def ice_spear():
    img = new(32, 32)
    rng = random.Random(5)
    for y in range(32):
        for x in range(32):
            t = rng.random()
            put(img, x, y, mix(hexc("#BFF3FF"), hexc("#5CC8F0"), t * 0.6))
    return img


# =============================================================================================
# Particles
# =============================================================================================

def particle_textures():
    out = {}
    out["glow"] = radial_glow(32, (255, 255, 255), 2.0)
    # spark: 4-point star
    sp = new(16, 16)
    for i in range(16):
        a = max(0, 1 - abs(i - 7.5) / 7.5) ** 1.5
        put(sp, i, 7, (255, 255, 255, int(255 * a)))
        put(sp, i, 8, (255, 255, 255, int(255 * a)))
        put(sp, 7, i, (255, 255, 255, int(255 * a)))
        put(sp, 8, i, (255, 255, 255, int(255 * a)))
    disc(sp, 8, 8, 2.2, (255, 255, 255, 255))
    out["spark"] = sp
    # bolt: glowing strip (bright line in the middle, soft edges)
    bolt = new(32, 8)
    for y in range(8):
        a = max(0, 1 - abs(y - 3.5) / 4) ** 1.6
        for x in range(32):
            put(bolt, x, y, (255, 255, 255, int(255 * a)))
    out["bolt"] = bolt
    core = new(32, 8)
    for y in range(8):
        a = 1.0 if 2 <= y <= 5 else (0.5 if y in (1, 6) else 0)
        for x in range(32):
            put(core, x, y, (255, 255, 255, int(255 * a)))
    out["core"] = core
    ring = new(64, 64)
    for y in range(64):
        for x in range(64):
            d = math.hypot(x + 0.5 - 32, y + 0.5 - 32) / 32
            a = max(0, 1 - abs(d - 0.86) / 0.13) ** 1.4 + max(0, 0.18 - d * 0.2) * 0
            put(ring, x, y, (255, 255, 255, int(255 * min(1, a))))
    out["ring"] = ring
    smoke = new(32, 32)
    rng = random.Random(11)
    for y in range(32):
        for x in range(32):
            d = math.hypot(x + 0.5 - 16, y + 0.5 - 16) / 16
            n = 0.75 + rng.random() * 0.25
            a = max(0, 1 - d) ** 1.2 * n
            put(smoke, x, y, (255, 255, 255, int(255 * a)))
    out["smoke"] = smoke
    flame = new(16, 16)
    stamp(flame, 0, 0, [
        ".......w........",
        "......ww........",
        "......www.......",
        ".....wwww.......",
        ".....wwwww...w..",
        "....wwwwww..ww..",
        "...wwwwwwww.ww..",
        "...wwwwwwwwwww..",
        "..wwwwwwwwwwww..",
        "..wwwwwwwwwwwww.",
        "..wwwwwwwwwwwww.",
        "..wwwwwwwwwwwww.",
        "...wwwwwwwwwww..",
        "....wwwwwwwww...",
        ".....wwwwwww....",
        "................",
    ], {"w": (255, 255, 255, 230)})
    out["flame"] = flame
    star = new(16, 16)
    stamp(star, 0, 0, [
        "................",
        ".......K........",
        "......KYK.......",
        "......KYK.......",
        ".....KYYYK......",
        "KKKKKYYYYYKKKKK.",
        ".KYYYYYWYYYYYK..",
        "..KYYYYWYYYYK...",
        "...KYYYYYYYK....",
        "....KYYYYYK.....",
        "...KYYYKYYYK....",
        "...KYYK.KYYK....",
        "..KYYK...KYYK...",
        "..KKK.....KKK...",
        "................",
        "................",
    ], {"K": hexc("#7A5A00"), "Y": hexc("#FFE45C"), "W": hexc("#FFFFFF")})
    out["star"] = star
    crack = new(64, 64)
    d = ImageDraw.Draw(crack)
    rng = random.Random(21)
    for i in range(9):
        ang = i / 9 * math.tau + rng.uniform(-0.2, 0.2)
        x, y = 32.0, 32.0
        for s in range(6):
            nx = x + math.cos(ang) * rng.uniform(3, 6)
            ny = y + math.sin(ang) * rng.uniform(3, 6)
            d.line([(x, y), (nx, ny)], fill=(255, 255, 255, 255), width=1)
            x, y = nx, ny
            ang += rng.uniform(-0.5, 0.5)
    for r in (8, 15):
        pts = []
        for i in range(12):
            a = i / 12 * math.tau
            rr = r + rng.uniform(-1.5, 1.5)
            pts.append((32 + math.cos(a) * rr, 32 + math.sin(a) * rr))
        d.line(pts + [pts[0]], fill=(235, 245, 255, 200), width=1)
    out["crack"] = crack
    shard = new(16, 16)
    stamp(shard, 0, 0, [
        "................",
        ".......W........",
        "......WWW.......",
        "......WWw.......",
        ".....WWWww......",
        ".....WWWww......",
        "....WWWWwww.....",
        "....WWWWwww.....",
        "....WWWwwww.....",
        ".....WWwww......",
        ".....WWww.......",
        "......Www.......",
        "......Ww........",
        ".......w........",
        "................",
        "................",
    ], {"W": (255, 255, 255, 255), "w": (210, 225, 235, 255)})
    out["shard"] = shard
    flake = new(8, 8)
    stamp(flake, 0, 0, ["........", "..WWW...", ".WwwWW..", ".WwwwWW.", "..WwwW..", "...WW...", "........", "........"],
          {"W": (255, 255, 255, 255), "w": (200, 190, 230, 255)})
    out["flake"] = flake
    fist = new(32, 32)
    fs = new(16, 16)
    stamp(fs, 0, 0, [
        "................",
        "....KKKKKKK.....",
        "...KWWKWWKWK....",
        "..KWWWKWWKWWK...",
        "..KWWWKWWKWWKK..",
        "..KKKKKKKKKKWK..",
        "..KWWWWWWWWWWK..",
        "..KWWWWWWWWWWK..",
        "...KWWWWWWWWK...",
        "....KWWWWWWK....",
        ".....KWWWWWK....",
        ".....KWWWWWK....",
        ".....KKKKKKK....",
        "................",
        "................",
        "................",
    ], {"K": (110, 70, 50, 255), "W": (255, 255, 255, 255)})
    fist.paste(upscale(fs, 2), (0, 0))
    out["fist"] = fist
    chain = new(16, 16)
    stamp(chain, 0, 0, [
        "................",
        "....GGGG........",
        "...GwwwwG.......",
        "...Gw..wG.......",
        "...GwwGGGG......",
        "....GGwwwwG.....",
        "......Gw..wG....",
        "......GwwGGGG...",
        ".......GGwwwwG..",
        ".........Gw..wG.",
        ".........GwwwwG.",
        "..........GGGG..",
        "................",
        "................",
        "................",
        "................",
    ], {"G": (90, 90, 100, 255), "w": (200, 200, 210, 255)})
    out["chain"] = chain
    coin = new(16, 16)
    disc(coin, 8, 8, 6, lambda x, y, d: hexc("#FFD24A") if d < 4.6 else hexc("#B8860B"))
    stamp(coin, 6, 5, ["W.", ".W"], {"W": hexc("#FFFFFF")})
    out["coin"] = coin
    marker = new(16, 16)
    stamp(marker, 0, 0, [
        "................",
        "....WWWWWWWW....",
        ".....WWWWWW.....",
        "......WWWW......",
        ".......WW.......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ], {"W": (255, 255, 255, 255)})
    out["marker"] = marker
    wave = new(32, 32)
    for y in range(32):
        for x in range(32):
            d = math.hypot(x + 0.5 - 16, y + 0.5 - 30) / 16
            a = max(0, 1 - abs(d - 0.8) / 0.15)
            if y > 24:
                a = 0
            put(wave, x, y, (255, 255, 255, int(255 * a)))
    out["wave"] = wave
    for k, img in out.items():
        save(img, f"particle/{k}.png")


# =============================================================================================
# HUD glyphs (font/glyph_E3.png): 16x16 grid of 16px cells, U+E300..U+E3FF
# =============================================================================================

def glyphs():
    sheet = new(256, 256)

    def cell(code, img):
        i = code - 0xE300
        sheet.paste(img, ((i % 16) * 16, (i // 16) * 16), img)

    def dim(img):
        out = img.copy()
        for y in range(16):
            for x in range(16):
                c = out.getpixel((x, y))
                if c[3]:
                    g = int((c[0] + c[1] + c[2]) / 3 * 0.55)
                    out.putpixel((x, y), (g, g, g, c[3]))
        return out

    arm, obs, conq = haki_icon("armament"), haki_icon("observation"), haki_icon("conqueror")
    cell(0xE300, dim(arm))
    cell(0xE301, arm)
    cell(0xE302, dim(obs))
    cell(0xE303, obs)
    cell(0xE304, dim(conq))
    cell(0xE305, conq)
    lock = new(16, 16)
    stamp(lock, 4, 2, ["..GGGG..", ".G....G.", ".G....G.", ".G....G.", "GGGGGGGG", "GgggggGG", "GggKKgGG", "GggKKgGG", "GgggggGG", "GGGGGGGG"],
          {"G": hexc("#6A6A6A"), "g": hexc("#8E8E8E"), "K": hexc("#2A2A2A")})
    cell(0xE306, lock)
    bolt = new(16, 16)
    stamp(bolt, 4, 1, ["....YY.", "...YY..", "..YY...", ".YYYYYY", "....YY.", "...YY..", "..YY...", ".YY....", "YY.....", "Y......"],
          {"Y": hexc("#FFD43B")})
    outline(bolt, hexc("#6A4A00"))
    cell(0xE307, bolt)
    flame = new(16, 16)
    stamp(flame, 3, 1, ["....P....", "...PP....", "...PPP...", "..PPPP.P.", "..PPPPPP.", ".PPMMPPPP", ".PPMMMPPP", ".PMMWMMPP", ".PMMWMMP.", "..PMMMP..", "...PPP..."],
          {"P": hexc("#9B4DFF"), "M": hexc("#D6B0FF"), "W": hexc("#FFFFFF")})
    outline(flame, hexc("#2A0A4A"))
    cell(0xE308, flame)
    fr = new(16, 16)
    fr.paste(devil_fruit("gomu"), (0, 0))
    cell(0xE309, fr)

    def seg(fill, edge, half=False, empty=False):
        g = new(16, 16)
        for y in range(4, 12):
            for x in range(0, 4):
                if empty:
                    c = hexc("#2A2433") if 5 <= y <= 10 else hexc("#14101A")
                elif half and x >= 2:
                    c = hexc("#2A2433") if 5 <= y <= 10 else hexc("#14101A")
                else:
                    c = edge if y in (4, 11) else (shade(fill, 1.25) if y == 5 else fill)
                put(g, x, y, c)
        return g

    cell(0xE310, seg(hexc("#A35CFF"), hexc("#3A1670")))
    cell(0xE311, seg(None, None, empty=True))
    cell(0xE312, seg(hexc("#FFC93B"), hexc("#6A4A00")))
    cell(0xE313, seg(None, None, empty=True))
    cell(0xE319, seg(hexc("#A35CFF"), hexc("#3A1670"), half=True))
    cell(0xE31A, seg(hexc("#FFC93B"), hexc("#6A4A00"), half=True))

    def clash_seg(fill, edge):
        g = new(16, 16)
        for y in range(3, 13):
            for x in range(0, 3):
                c = edge if y in (3, 12) else (shade(fill, 1.3) if y in (4, 5) else fill)
                put(g, x, y, c)
        return g

    cell(0xE314, clash_seg(hexc("#E53935"), hexc("#4A0A0A")))
    cell(0xE315, clash_seg(hexc("#5A1A8A"), hexc("#14051F")))
    core = new(16, 16)
    stamp(core, 0, 0, [
        "....W...",
        "...WYW..",
        "..WYKYW.",
        ".WYKKKYW",
        "WYKKRKKY",
        ".WYKKKYW",
        "..WYKYW.",
        "...WYW..",
        "....W...",
    ], {"W": hexc("#FFFFFF"), "Y": hexc("#FF4A3A"), "K": hexc("#14050A"), "R": hexc("#FF2A2A")})
    shifted = new(16, 16)
    shifted.paste(core, (0, 3), core)
    cell(0xE316, shifted)
    capl = new(16, 16)
    stamp(capl, 0, 3, ["KK", "K.", "K.", "K.", "K.", "K.", "K.", "K.", "K.", "KK"], {"K": hexc("#F5C542")})
    cell(0xE317, capl)
    capr = new(16, 16)
    stamp(capr, 0, 3, ["KK", ".K", ".K", ".K", ".K", ".K", ".K", ".K", ".K", "KK"], {"K": hexc("#F5C542")})
    cell(0xE318, capr)
    path = os.path.join(RP, "font", "glyph_E3.png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sheet.save(path)
    SAVED.append(("font/glyph_E3.png", sheet))


# =============================================================================================
# Pack icons and UI icons
# =============================================================================================

def pack_icon():
    S = 256
    img = Image.new("RGBA", (S, S), (0, 0, 0, 255))
    px = img.load()
    for y in range(S):
        for x in range(S):
            d = math.hypot(x - S / 2, y - S * 0.58) / (S * 0.75)
            c = mix(hexc("#5A0A10"), hexc("#07020A"), min(1, d))
            px[x, y] = c
    d = ImageDraw.Draw(img)
    rng = random.Random(4)
    # black lightning with red glow, radiating from the crown
    cx, cy = S / 2, S * 0.56
    for i in range(11):
        ang = -math.pi / 2 + (i - 5) * 0.32 + rng.uniform(-0.08, 0.08)
        pts = [(cx, cy)]
        x, y = cx, cy
        for s in range(7):
            x += math.cos(ang) * rng.uniform(12, 22)
            y += math.sin(ang) * rng.uniform(12, 22)
            ang += rng.uniform(-0.45, 0.45)
            pts.append((x, y))
        d.line(pts, fill=(255, 40, 40, 255), width=9)
        d.line(pts, fill=(10, 0, 4, 255), width=4)
    # crown
    crown = upscale(haki_icon("conqueror"), 10)
    img.alpha_composite(crown, (int(cx - 80), int(cy - 70)))
    # devil fruit badge
    fruit = upscale(devil_fruit("gomu"), 5)
    img.alpha_composite(fruit, (S - 92, S - 92))
    arm = upscale(haki_icon("armament"), 4)
    img.alpha_composite(arm, (12, S - 76))
    # title
    from PIL import ImageFont
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 27)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except OSError:
        font = small = None
    if font:
        for text, f, y in (("GRAND LINE", font, 14), ("HAKI CLASH", small, 48)):
            tw = d.textlength(text, font=f)
            x = (S - tw) / 2
            d.text((x + 3, y + 3), text, font=f, fill=(0, 0, 0, 255))
            d.text((x, y), text, font=f, fill=(245, 197, 66, 255) if f is font else (255, 80, 70, 255))
    # frame
    d.rectangle([2, 2, S - 3, S - 3], outline=(227, 179, 65, 255), width=5)
    return img


def ui_icons():
    for kind in ("armament", "observation", "conqueror"):
        save(haki_icon(kind, 32), f"ui/{kind}.png")
    g = new(16, 16)
    stamp(g, 2, 1, [
        "....KKKKK...",
        "...KwwwwwK..",
        "..KwwwwwwwK.",
        "..KwwKKwwwK.",
        "..KwwKwwwwK.",
        "..KwwwwwwKK.",
        "..KKKKKKKK..",
        "...KwwwwwK..",
        "....KwwwK...",
        ".....KwK....",
        "......K.....",
        "...GGGGGGG..",
        "....GGGGG...",
    ], {"K": hexc("#3A2A12"), "w": hexc("#F2E6C8"), "G": hexc("#E3B341")})
    save(upscale(g, 2), "ui/guide.png")


# =============================================================================================

def preview(path):
    """Contact sheet of everything generated, scaled up for review."""
    cells = []
    for rel, img in SAVED:
        if img.width > 64:
            k = 2 if img.width <= 128 else 1
        else:
            k = max(1, 64 // max(img.width, img.height))
        cells.append((rel, upscale(img, k)))
    W = 1100
    x = y = 0
    row_h = 0
    positions = []
    for rel, im in cells:
        if x + im.width + 8 > W:
            x = 0
            y += row_h + 8
            row_h = 0
        positions.append((x, y, im))
        x += im.width + 8
        row_h = max(row_h, im.height)
    sheet = Image.new("RGBA", (W, y + row_h + 8), (70, 74, 82, 255))
    for (x, y, im) in positions:
        bg = Image.new("RGBA", im.size, (40, 42, 48, 255))
        sheet.alpha_composite(bg, (x, y))
        sheet.alpha_composite(im, (x, y))
    sheet.save(path)


def main():
    for key in FRUITS:
        save(devil_fruit(key), f"items/{key}_{key}_no_mi.png")
    for key in FRUITS:
        for n in (1, 2, 3):
            save(skill_icon(key, n), f"items/skill_{key}_{n}.png")
    for kind in ("armament", "observation", "conqueror"):
        save(haki_icon(kind), f"items/{kind}_haki.png")
    save(codex(), "items/haki_codex.png")
    save(treasure(), "items/treasure_chest.png")
    save(jolly_roger(), "items/jolly_roger.png")
    save(seastone("raw"), "items/raw_seastone.png")
    save(seastone("ingot"), "items/seastone_ingot.png")
    save(seastone("cuffs"), "items/seastone_cuffs.png")
    save(seastone("jitte"), "items/seastone_jitte.png")
    save(katana("#E8EEF2", "#FFFFFF", "#F2F2F2", "#C9A227"), "items/wado_ichimonji.png")
    save(katana("#1A1420", "#8E1B2A", "#3A0A0F", "#E3B341"), "items/black_blade.png")
    save(seastone_ore(), "blocks/seastone_ore.png")
    cap, eyes = captain_texture()
    save(cap, "entity/conqueror_pirate.png")
    save(eyes, "entity/conqueror_pirate_eyes.png")
    for kind in ("brawler", "gunner", "flame"):
        save(pirate_texture(kind), f"entity/pirate_{kind}.png")
    save(rubber_fist(), "entity/rubber_fist.png")
    save(ice_spear(), "entity/ice_spear.png")
    bullet = new(16, 16, hexc("#2A2A2A"))
    save(bullet, "entity/pirate_bullet.png")
    save(new(16, 16, (255, 255, 255, 0)), "entity/blank.png")
    particle_textures()
    glyphs()
    ui_icons()
    icon = pack_icon()
    for base in (BP, RP):
        icon.save(os.path.join(base, "pack_icon.png"))
    SAVED.append(("pack_icon.png", icon))
    if "--preview" in sys.argv:
        out = sys.argv[sys.argv.index("--preview") + 1]
        preview(out)
        print("preview written to", out)
    print(f"{len(SAVED)} textures generated")


if __name__ == "__main__":
    main()
