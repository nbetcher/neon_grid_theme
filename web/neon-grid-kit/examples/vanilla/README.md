# Plain HTML template

This is the complete approved channel-console example, with fictional calls and the theme extracted into a reusable core. No framework, CDN, account, or backend is needed.

From the kit root:

```sh
npm ci
npm run build:core
npm run build --workspace @neon-grid/example-vanilla
npm run preview
```

Open http://127.0.0.1:4320/vanilla/. Copy `dist/` to any static host; its theme, scripts, and licensed fonts are self-contained. The gallery link points to the hosting site's root and can be changed or removed.

For a new app, import `theme.css`, wrap your UI in `.ng-theme`, and initialize `createThemeController(root)` after mounting. `app.js` is example application logic, not a dependency of the theme. `theme.js` shows controls, stable SVG id prefixes, explicit arrival pulses and teardown. Use CSS classes from the core README for custom content.

The example uses modules, so serve it over HTTP instead of opening it with `file://`.
