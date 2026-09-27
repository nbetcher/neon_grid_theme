# Neon Grid core

Import `@neon-grid/kit-core/theme.css` once. It supplies the approved scoped design, default tokens, and licensed local fonts. Use the framework adapters or create a root yourself:

```html
<div class="ng-theme" data-glow="soft" data-intensity="balanced"
     data-ambient="stopped" data-reading="false">
  <article class="channel-card" data-ng-panel>
    <div class="transmissions"><p class="transmission-text">Your content</p></div>
    <span class="arrival-field" data-ng-arrival aria-hidden="true"></span>
  </article>
</div>
```

```js
import { createThemeController } from '@neon-grid/kit-core';
const root = document.querySelector('.ng-theme');
const theme = createThemeController(root, { glow: 'balanced', motion: true });
theme.update({ focus: true });
theme.update({ focus: false });
// Invoke after your application commits newly arrived data:
theme.pulse(root.querySelector('[data-ng-panel]'));
// Invoke when your component unmounts:
theme.destroy();
```

Options: `glow` is balanced/subtle/off; `motion`, `focus`, and `paused` are booleans. `update()` accepts a partial options object. `pulse()` returns false when motion is stopped or the panel lacks its direct `[data-ng-arrival]` child. The controller handles reduced motion, forced colors, visibility, open dialogs and cleanup. It has no record store, network requests, timers for fake activity or storage writes. Server imports are safe; initialize only after mounting. `ng:statechange` carries resolved options plus `ambient` and `reason`.

`navMarkup()`, `signalMarkup(id)` and `identityMarkup(id)` return trusted constant decorative markup. An id prefix must begin with a letter and contain only letters, numbers, `_` or `-`; each instance needs a unique prefix. The adapters supply SSR-stable defaults. Wrap decorations in `.ng-decoration` (`display: contents`) and keep application/user text in ordinary escaped framework content.

For navigation, add `data-ng-nav` to a `.nav-item` button/anchor, wrap its label/icon in `.nav-content`, and append `navMarkup()`. Use `.selected` and `aria-current="page"` together. Root-level event delegation also covers new navigation items after mount; it does not implement routing.

Layout recipes and component classes are shown in the seven examples. Use `.sidebar`, `.workspace`, `.topbar`, `main`, `.page-heading`, `.heading-actions`, `.button.primary/.secondary`, `.channel-card`, `.channel-header`, `.transmissions`, `.transmission`, `.transmission-text`, `.channel-meta` and `.page-footer`. Set each panel's `--channel-color` to its accent. `.detail-content` styles the body of a call dialog. `.skip-link.sr-only` becomes visible when focused.

The root owns colors/type; descendant rules are scoped to `.ng-theme`, animation names are prefixed `ng-`, and SVG paint references are unique per instance. Font faces are globally registered under their actual family names. Do not nest theme roots. Full-screen sidebar layouts need a body margin reset supplied by the host. Ordinary controls and cards can be used without the full shell.

See the kit README for token customization, Tailwind/Sass exports, packaging and validation. The default typography adds 1pt only to original sizes <=16px; it does not recursively enlarge inherited spans or headings.
