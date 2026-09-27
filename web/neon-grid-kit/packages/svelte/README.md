# Neon Grid for Svelte 5

Native typed Svelte components using snippets and runes. The package includes `Theme`, `Button`, `NavItem`, `Panel`, `Signal`, and `Identity`. Shared colors, spacing, local fonts, glow, and animation live in `@neon-grid/kit-core`; the adapter does not duplicate their implementation.

From the kit root, after installing the workspace dependencies:

```sh
npm run build --workspace @neon-grid/kit-core
npm run build --workspace @neon-grid/kit-svelte
npm run check --workspace @neon-grid/kit-svelte
npm run dev --workspace @neon-grid/example-svelte
```

The library build uses the official `svelte-package` tool and emits `.svelte` components, JavaScript, and TypeScript declarations into `dist`. Consumers need Svelte 5.57 or later and a Svelte-aware bundler. This is a source component package, so it supports both client and server compilation.

## Use

Import the stylesheet once in the application entry or root layout:

```svelte
<script lang="ts">
  import '@neon-grid/kit-core/theme.css';
  import { tick } from 'svelte';
  import { Theme, Button, NavItem, Panel, Signal, Identity,
    type ThemeController } from '@neon-grid/kit-svelte';

  let focus = $state(false);
  let panel = $state<HTMLElement | null>(null);
  let text = $state('The original transmission.');
  let controller: ThemeController | null = null;

  async function receiveCall() {
    text = 'A new transmission has arrived.';
    await tick();
    if (panel) controller?.pulse(panel);
  }
</script>

<Theme {focus} onController={(value) => { controller = value; }}>
  <NavItem selected>Live channels</NavItem>
  <Signal />
  <div class="page-heading">
    <div><h1>Live <span class="title-outline">channels</span></h1></div>
    <Identity />
  </div>
  <Button onclick={() => { focus = !focus; }}>Toggle focus</Button>
  <Button variant="primary" onclick={receiveCall}>Add call</Button>
  <Panel bind:element={panel} color="#00e0ff">
    <div class="transmissions"><p class="transmission-text">{text}</p></div>
  </Panel>
</Theme>
```

Use the complete example for the sidebar, header, and page layout. The snippet above shows component wiring.

## Component contract

| Component | Props and behavior |
| --- | --- |
| `Theme` | `glow: 'balanced' \| 'subtle' \| 'off'`, `motion`, `focus`, `paused`; native div attributes and a `children` snippet. Calls `onController(controller)` after mounting and the same callback with `null` on teardown. `onStateChange(event)` receives the core `ng:statechange` event. |
| `Button` | Native button attributes/events, `children`, and `variant: 'primary' \| 'secondary'`. Defaults to `type="button"`. |
| `NavItem` | Native button attributes/events, `children`, and `selected`. Adds the hover optics and `aria-current="page"` for selection. Connect `onclick` to your application router or view state. |
| `Panel` | Native article attributes, `children`, `color`, and optional `bind:element`. Includes the arrival layer required by `controller.pulse(element)`. |
| `Signal` / `Identity` | Decorative SVGs. Automatic IDs use Svelte's SSR-stable component ID. Optional explicit `id` must be unique in the document and match `[A-Za-z][A-Za-z0-9_-]*`. |

`Theme` creates one controller for its own root during `onMount` and destroys it during unmount. Prop changes update that controller. Server rendering never touches the DOM and always emits `data-ambient="stopped"`. Reduced motion, forced colors, hidden tabs, Focus mode, and pause behavior are handled by core. Keep `onController` stable for the lifetime of an instance.

Call `pulse` only after a real data update and after `tick()`. Do not pulse from an effect that observes filtered or sorted results: revealing existing data should not look like a new event. The theme never stores or derives call history. It owns only decoration attributes and the pre-rendered arrival layer; application text is rendered by Svelte. `{@html}` is used only for trusted core SVG decorations.

For SSR islands mounted separately, use Svelte's distinct `idPrefix` render/hydrate option per island, or explicit decoration IDs. Within a normally rendered Svelte tree, automatic IDs are unique.

The implementation follows the official [Svelte lifecycle hooks](https://svelte.dev/docs/svelte/lifecycle-hooks), [typed props and stable component IDs](https://svelte.dev/docs/svelte/$props), and [package build](https://svelte.dev/docs/kit/packaging) documentation.
