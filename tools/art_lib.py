"""Tiny pixel-art helpers shared by the texture generators."""
import colorsys
import math
import random

from PIL import Image


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def shade(c, f):
    """Multiply brightness (f<1 darker, f>1 lighter) keeping hue."""
    r, g, b = [x / 255 for x in c[:3]]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0.0, min(1.0, l * f))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (int(r * 255), int(g * 255), int(b * 255), c[3] if len(c) > 3 else 255)


def hue_shift(c, dh, ds=0.0, dl=0.0):
    r, g, b = [x / 255 for x in c[:3]]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h = (h + dh) % 1.0
    s = max(0, min(1, s + ds))
    l = max(0, min(1, l + dl))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (int(r * 255), int(g * 255), int(b * 255), c[3] if len(c) > 3 else 255)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def new(w, h, fill=(0, 0, 0, 0)):
    return Image.new("RGBA", (w, h), fill)


def put(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((int(x), int(y)), c)


def get(img, x, y):
    if 0 <= x < img.width and 0 <= y < img.height:
        return img.getpixel((int(x), int(y)))
    return (0, 0, 0, 0)


def rect(img, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(img, xx, yy, c)


def fill_fn(img, x, y, w, h, fn):
    """fn(u, v) -> color, with u, v in pixels relative to the rect."""
    for yy in range(h):
        for xx in range(w):
            c = fn(xx, yy)
            if c is not None:
                put(img, x + xx, y + yy, c)


def stamp(img, x, y, rows, palette):
    """Draws an ASCII sprite; '.' and ' ' are transparent."""
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in ". ":
                continue
            put(img, x + i, y + j, palette[ch])


def outline(img, color, diagonal=False):
    """Adds a 1px outline around opaque pixels."""
    src = img.copy()
    for y in range(img.height):
        for x in range(img.width):
            if src.getpixel((x, y))[3] > 0:
                continue
            n = [(1, 0), (-1, 0), (0, 1), (0, -1)]
            if diagonal:
                n += [(1, 1), (-1, -1), (1, -1), (-1, 1)]
            if any(get(src, x + dx, y + dy)[3] > 0 for dx, dy in n):
                img.putpixel((x, y), color)
    return img


def line(img, x0, y0, x1, y1, c):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(img, x0, y0, c)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def disc(img, cx, cy, r, c_fn):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            if d <= r:
                c = c_fn(x, y, d) if callable(c_fn) else c_fn
                if c is not None:
                    put(img, x, y, c)


def noise_rng(seed):
    return random.Random(seed)


def upscale(img, k):
    return img.resize((img.width * k, img.height * k), Image.NEAREST)


def radial_glow(size, color=(255, 255, 255), power=2.2):
    img = new(size, size)
    c = size / 2
    for y in range(size):
        for x in range(size):
            d = math.hypot(x + 0.5 - c, y + 0.5 - c) / c
            a = max(0.0, 1 - d) ** power
            img.putpixel((x, y), (color[0], color[1], color[2], int(255 * a)))
    return img
