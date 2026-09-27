# Neon Grid for React

Native React components over the shared Neon Grid CSS, SVG decorations, and motion controller. The approved spacing, cyan/violet/magenta treatment, and final 1 pt increase for the original small fonts come from the same core stylesheet used by every framework.

From the kit root, build with `npm run build --workspace @neon-grid/kit-react`. React 19 is a peer dependency. Import the stylesheet once at your app entry or Next root layout:

```tsx
import '@neon-grid/kit-core/theme.css';
import { Button, NavItem, Panel, Signal, Theme } from '@neon-grid/kit-react';

export function Workspace() {
  return (
    <Theme glow="balanced" motion focus={false}>
      <nav aria-label="Workspace">
        <NavItem selected>Overview</NavItem>
        <NavItem href="/history">History</NavItem>
      </nav>
      <Panel color="#00e0ff">
        <header className="channel-header"><h2>Activity</h2></header>
        <div className="transmissions"><p className="transmission-text">Your content stays in React.</p></div>
      </Panel>
      <Button variant="primary">Continue</Button>
      <Signal />
    </Theme>
  );
}
```

| Component | Props and behavior |
| --- | --- |
| `Theme` | Native div props plus `glow`, `motion`, `focus`, `paused`, `onController`. Creates one controller after mounting and destroys it on unmount. |
| `Button` | Native button props/ref, `variant="primary"` or `"secondary"`; defaults to `type="button"`. |
| `NavItem` | Native button props, or anchor props when `href` is supplied; `selected` controls appearance and `aria-current`. |
| `Panel` | Native article props/ref and `color`; includes the arrival decoration required by `pulse`. |
| `Signal`, `Identity` | `id` for an optional stable SVG gradient prefix and `className`. Omitted IDs use React `useId`. |

Use the same layout classes as the runnable React example for the full console. The theme is scoped and does not reset the host document: set `body { margin: 0 }` for an edge-to-edge workspace. Components deliberately leave application content, routing, permissions, and call state with the application. A button NavItem needs an `onClick`; an anchor uses ordinary browser navigation, so it can also be composed with your router as appropriate.

For arrival feedback, call `pulse` after React commits the new content:

```tsx
import { useEffect, useRef } from 'react';
import { Panel, useThemeController } from '@neon-grid/kit-react';

function ActivityPanel({ revision, text }: { revision: number; text: string }) {
  const controller = useThemeController(); // Render this component inside Theme.
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (revision > 0 && panel.current) controller?.pulse(panel.current);
  }, [controller, revision]);
  return <Panel ref={panel}><div className="transmissions"><p className="transmission-text">{text}</p></div></Panel>;
}
```

`useThemeController()` returns `null` during SSR and before the theme mounts. Alternatively, provide a stable `onController` callback to Theme; cleanup calls it with `null`. Control preferences through Theme props so application state and rendering agree. Reduced motion, forced colors, a hidden tab, an open dialog inside the theme, Focus mode, and paused/off options take precedence over decorative animation. The core controller owns only theme attributes and decorations, not application records.

The emitted ESM retains the `use client` directive for Next.js. Rendering on the server uses deterministic stopped-motion attributes; listeners start only after hydration. Do not conditionally render different server/client component trees: React's [useId documentation](https://react.dev/reference/react/useId) explains the stable-ID requirement. For multiple independent React roots, supply distinct `identifierPrefix` values to `createRoot`/`hydrateRoot`.

For Next.js, import the CSS in `app/layout.tsx`, render interactive state from a client component, and add `@neon-grid/kit-react` and `@neon-grid/kit-core` to `transpilePackages` when using this workspace. See the [Next client-boundary documentation](https://nextjs.org/docs/app/api-reference/directives/use-client) and the complete `examples/next` starter. There are no CDN assets, injected application HTML, timers that produce fake activity, or automatic local-storage writes.
