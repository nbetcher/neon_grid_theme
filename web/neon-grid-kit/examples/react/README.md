# React starter

A runnable Vite + React 19 template using the native `@neon-grid/kit-react` package. From the kit root, after `npm ci`:

```sh
npm run build:core
npm run build --workspace @neon-grid/kit-react
npm run dev --workspace @neon-grid/example-react
```

Open `http://127.0.0.1:4311` in Microsoft Edge. Build with `npm run build --workspace @neon-grid/example-react`; serve `dist/` with an HTTP static server. Vite uses a relative asset base so the built demo can live in a gallery subdirectory.

`src/App.tsx` owns fictional call state, navigation, search, and theme preferences. Add demo call commits a native React update and then pulses the first panel. Live view shows the last three sample calls; archive keeps the last twelve in memory. These deliberate sample limits are not a production implementation of Verde Watch's adaptive look-back heuristic.

The app uses React Strict Mode to exercise effect cleanup during development. Glow, Focus, and motion remain independently controlled, while the core honors OS accessibility settings. All fonts and decorative assets are local. The native components can be reused without this demo layout; see `packages/react/README.md` for the public API.

After building the React adapter and Next example, run `node examples/react/scripts/check-lifecycle.mjs` from the kit root for the independent Microsoft Edge check. It starts its own servers on 4311/4314, checks React and Next rendering and controls at five viewport widths, and exercises Strict Mode mount/unmount cleanup with multiple decorations and dynamic navigation. Servers and browser are closed in `finally`. The lifecycle fixture is development-only and is not an entry in the Vite production build.
