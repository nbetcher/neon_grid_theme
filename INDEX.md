# Neon Grid

A **neon design system** inspired by a certain 80's film with "The Grid" — a deep blue-black substrate lit by a full spectrum of
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
| Cyan | `#00E0FF` | brand / primary |
| Green | `#00FF95` | positive / secondary |
| Fuchsia | `#FF2DAA` | tertiary |
| Orange | `#FF9500` | action / accent |
| Blue | `#1F9BFF` | metric gradients |
| Violet | `#8A45FF` | brand gradients |
| Red | `#FF3B5C` | danger / error |
| Yellow | `#FFE11A` | caution |

**Substrate** `#0A0A12` → `#1C1C44` (void → elevated)  · **Text** `#EAF0FB` / `#9FB0D6` / `#62749C`

**Type** — *Display voice*: Orbitron (wide, letter-spaced). *Mono voice*: Share Tech Mono.
**Corners** — 6 / 8 / 12 / 20 dp. **Spacing** — a healthy medium (48dp targets, 16dp card padding).

## Provenance

Modeled after a cyberpunk RFID access-control web UI. The grid backdrop is kept; the scan-line
overlay is deliberately dropped on every platform.
