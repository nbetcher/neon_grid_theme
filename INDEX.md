# Neon Grid

A Tron-inspired **neon design system** — a deep blue-black substrate lit by a full spectrum of
neon: fuchsia, green, orange, cyan, blue, violet, red, yellow. Glowing strokes, gradient hairlines,
letter-spaced display type over terminal mono. (Grid: yes. Scanlines: intentionally omitted.)

## Platforms

| Platform / framework | Status | Location |
|---|---|---|
| **Android — Material 3 (View system)** | ✅ Available | [`/android`](android/) |
| Android — Jetpack Compose | ⏳ Planned | — |
| Web — CSS / custom properties | ⏳ Planned | — |
| iOS — SwiftUI | ⏳ Planned | — |
| Flutter — ThemeData | ⏳ Planned | — |
| React — CSS-in-JS / tokens | ⏳ Planned | — |

Each platform implements the same shared design tokens below, idiomatically.

## Design tokens

**The neon spectrum**

| Token | Hex | Typical role |
|---|---|---|
| Fuchsia | `#FF2DAA` | brand / primary |
| Green | `#00FF88` | positive / secondary |
| Orange | `#FF8A00` | action / tertiary |
| Cyan | `#00D4FF` | info / accent |
| Blue | `#0088FF` | metric gradients |
| Violet | `#7B2FFF` | brand gradients |
| Red | `#FF3355` | danger / error |
| Yellow | `#FFDD00` | caution |

**Substrate** `#0A0A12` → `#1C1C44` (void → elevated)  · **Text** `#E6ECF5` / `#93A4C4` / `#5C6E92`

**Type** — *Display voice*: Orbitron (wide, letter-spaced). *Mono voice*: Share Tech Mono.
**Corners** — 6 / 8 / 12 / 20 dp. **Spacing** — a healthy medium (48dp targets, 16dp card padding).

## Provenance

Modeled after a cyberpunk RFID access-control web UI. The grid backdrop is kept; the scan-line
overlay is deliberately dropped on every platform.
