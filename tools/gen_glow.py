#!/usr/bin/env python3
"""Neon-glow 9-patch generator — tuned to the HTML reference (--glow-cyan): a crisp neon border
with a SOFT hug-halo (0 0 7px @0.6, 18px @0.32, 38px @0.14), not a fat bloom. Subtle, alpha-over
(not additive). Rendered at xxhdpi (3px/dp). Tweak GLOW_SCALE/GLOW_PEAK to taste."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SCALE = 3
OUT = r"D:/Documents/Projects/neon_grid_theme/android/theme/src/main/res/drawable-xxhdpi"
os.makedirs(OUT, exist_ok=True)

SURFACE = (17, 17, 37, 255)
TRACK   = (12, 12, 26, 255)

HUES = {
    "cyan":    (0, 224, 255),
    "green":   (0, 255, 150),
    "fuchsia": (255, 45, 170),
    "orange":  (255, 150, 10),
    "violet":  (140, 80, 255),
    "red":     (255, 70, 100),
    "blue":    (40, 150, 255),
    "yellow":  (255, 225, 30),
    "neutral": (120, 140, 180),
}

# Soft hug glow tuned to the HTML --glow-cyan falloff. ONE knob scales the whole theme's bloom:
# GLOW_SCALE multiplies blur sigma, peak alpha (clamped), AND the transparent spread padding, so
# "+25%" is a single edit. (peak clamped to 0.90 so hot cores never blow to white.)
GLOW_SCALE = 1.25

def _scl(levels):
    return [(b * GLOW_SCALE, min(a * GLOW_SCALE, 0.90)) for b, a in levels]

CARD_LEVELS = _scl([(2.5, 0.48), (6, 0.25), (13, 0.115)])
BTN_LEVELS  = _scl([(2, 0.46), (5, 0.24), (10, 0.11)])
CTRL_LEVELS = _scl([(2, 0.6), (4.5, 0.34), (8, 0.16)])   # checkbox / radio — small, needs a touch more

def dp(v):
    return int(round(v * SCALE))

def mix(c, white=0.0):
    return tuple(int(round(ch + (255 - ch) * white)) for ch in c)

def soft_glow(mask, rgb, levels):
    """Alpha-over stack of blurred silhouettes — a gentle halo, capped at each level's alpha."""
    W, H = mask.size
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for blur_dp, a in levels:
        b = np.asarray(mask.filter(ImageFilter.GaussianBlur(dp(blur_dp))), np.float32) / 255.0
        layer = np.zeros((H, W, 4), np.uint8)
        layer[..., 0] = rgb[0]; layer[..., 1] = rgb[1]; layer[..., 2] = rgb[2]
        layer[..., 3] = np.clip(b * a * 255.0, 0, 255).astype(np.uint8)
        glow = Image.alpha_composite(glow, Image.fromarray(layer, "RGBA"))
    return glow

def write_ninepatch(img, stretch_box, content_box, path):
    w, h = img.size
    out = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    out.paste(img, (1, 1))
    px = out.load()
    sx0, sx1, sy0, sy1 = stretch_box
    cx0, cx1, cy0, cy1 = content_box
    B = (0, 0, 0, 255)
    for x in range(sx0, sx1): px[x + 1, 0] = B
    for y in range(sy0, sy1): px[0, y + 1] = B
    for x in range(cx0, cx1): px[x + 1, h + 1] = B
    for y in range(cy0, cy1): px[w + 1, y + 1] = B
    out.save(path)

def glow_panel(name, rgb, radius_dp, thick_dp, glow_dp, pad_dp, inner_dp, levels,
               fill=SURFACE, border_white=0.10):
    r = dp(radius_dp); t = dp(thick_dp); g = dp(glow_dp); ip = dp(pad_dp)
    fixed = g + r + t + ip
    W = 2 * fixed + dp(6)
    H = W
    rect = [g, g, W - g - 1, H - g - 1]

    # soft outer halo from the filled silhouette (box-shadow style)
    sil = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sil).rounded_rectangle(rect, radius=r, fill=255)
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base = Image.alpha_composite(base, soft_glow(sil, rgb, levels))

    # opaque fill on top (hides the inner half of the halo, leaving a clean outer hug)
    fimg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(fimg).rounded_rectangle(rect, radius=r, fill=fill)
    base = Image.alpha_composite(base, fimg)

    # crisp neon border
    bimg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(bimg).rounded_rectangle(rect, radius=r,
                                           outline=mix(rgb, border_white) + (255,), width=t)
    base = Image.alpha_composite(base, bimg)

    c = W // 2
    sb = (c - dp(3), c + dp(3), c - dp(3), c + dp(3))
    ci = g + t + dp(inner_dp)
    cb = (ci, W - ci, ci, H - ci)
    write_ninepatch(base, sb, cb, os.path.join(OUT, f"{name}.9.png"))

def bar(name, rgb, glow_dp=5, H_dp=22, ch_dp=10):
    H = dp(H_dp); ch = dp(ch_dp)
    top = (H - ch) // 2; bot = H - top
    r = ch // 2; end = r + dp(3)
    W = 2 * end + dp(8)
    rect = [end - r, top, W - (end - r) - 1, bot - 1]
    sil = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sil).rounded_rectangle(rect, radius=r, fill=255)
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base = Image.alpha_composite(base, soft_glow(sil, rgb, _scl([(1.5, 0.55), (4, 0.30), (8, 0.14)])))
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.rounded_rectangle(rect, radius=r, fill=mix(rgb, 0.10) + (255,))
    cy = H // 2
    bd.rounded_rectangle([rect[0], cy - dp(1.4), rect[2], cy + dp(1.4)], radius=dp(1),
                         fill=mix(rgb, 0.55) + (235,))
    base = Image.alpha_composite(base, body)
    c = W // 2
    sb = (c - dp(3), c + dp(3), cy - dp(1), cy + dp(1))
    cb = (end, W - end, top, bot)
    write_ninepatch(base, sb, cb, os.path.join(OUT, f"{name}.9.png"))

def bar_track(name, H_dp=22, ch_dp=10):
    t = dp(1.2); H = dp(H_dp); ch = dp(ch_dp)
    top = (H - ch) // 2; bot = H - top
    r = ch // 2; end = r + dp(3)
    W = 2 * end + dp(8)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rect = [end - r, top, W - (end - r) - 1, bot - 1]
    d.rounded_rectangle(rect, radius=r, fill=TRACK)
    d.rounded_rectangle(rect, radius=r, outline=(50, 66, 120, 255), width=t)
    c = W // 2
    sb = (c - dp(3), c + dp(3), H // 2 - dp(1), H // 2 + dp(1))
    cb = (end, W - end, top, bot)
    write_ninepatch(img, sb, cb, os.path.join(OUT, f"{name}.9.png"))

# Panels (per hue) — subtle hug-glow, +25% (GLOW_SCALE) on blur/alpha/spread
for hue in ("cyan", "green", "fuchsia", "orange", "violet", "red"):
    glow_panel(f"ng_glow_card_{hue}", HUES[hue], radius_dp=13, thick_dp=1.6,
               glow_dp=round(14 * GLOW_SCALE), pad_dp=6, inner_dp=14, levels=CARD_LEVELS)

# Glow buttons — the filled action buttons (HOT tier); border hug + text-glow.
for hue in ("cyan", "green", "fuchsia", "orange", "red", "violet"):
    glow_panel(f"ng_glow_btn_{hue}", HUES[hue], radius_dp=8, thick_dp=1.6,
               glow_dp=round(9 * GLOW_SCALE), pad_dp=4, inner_dp=6, levels=BTN_LEVELS)

bar_track("ng_bar_track")
for hue in ("cyan", "green", "fuchsia", "violet", "orange", "red"):
    bar(f"ng_bar_fill_{hue}", HUES[hue])

def glow_sprite(name, rgb, shape, box_dp=22, canvas_dp=38, levels=CTRL_LEVELS, radius_dp=6):
    """Fixed-size soft-glow halo (no border/fill) sized for a small control (checkbox/radio).
    The control's own XML draws the crisp box on top."""
    C = dp(canvas_dp); b = dp(box_dp)
    off = (C - b) // 2
    rect = [off, off, off + b - 1, off + b - 1]
    sil = Image.new("L", (C, C), 0)
    d = ImageDraw.Draw(sil)
    if shape == "oval":
        d.ellipse(rect, fill=255)
    else:
        d.rounded_rectangle(rect, radius=dp(radius_dp), fill=255)
    soft_glow(sil, rgb, levels).save(os.path.join(OUT, f"{name}.png"))

glow_sprite("ng_glow_cb", HUES["cyan"], "rect")
glow_sprite("ng_glow_radio", HUES["cyan"], "oval")

print("done")
