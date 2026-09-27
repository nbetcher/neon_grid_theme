# Neon Grid for Vue and Nuxt

Native Vue 3 single-file components using the shared Neon Grid CSS, design tokens, and motion controller. The source SFC exports are intentionally compiled by your Vite or Nuxt application, so slots, scoped CSS, and Vue types work normally. No runtime Vue compiler or HTML application injection is required.

Import the CSS once in your app entry:

```ts
import '@neon-grid/kit-core/theme.css';
```

```vue
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Theme, Button, Panel } from '@neon-grid/kit-vue';
import type { ThemeController } from '@neon-grid/kit-core';

const panel = ref<InstanceType<typeof Panel> | null>(null);
let controller: ThemeController | null = null;
const words = ref('Your content here.');
async function updateContent() {
  words.value = 'New content has arrived.';
  await nextTick();
  if (panel.value?.element) controller?.pulse(panel.value.element);
}
</script>

<template>
  <Theme @ready="controller = $event" glow="balanced" :motion="true">
    <Button variant="primary" @click="updateContent">Add content</Button>
    <Panel ref="panel" accent="#00e0ff">
      <p class="transmission-text">{{ words }}</p>
    </Panel>
  </Theme>
</template>
```

For components nested below `Theme`, import `useNeonTheme` to get a read-only ref to the nearest controller. It is `null` before mounting and after unmounting. Access `.value` when handling new data; do not copy its initial value during setup.

| Component | Props | Content / exposed API |
| --- | --- | --- |
| `Theme` | `glow`: balanced / subtle / off; `motion`, `focus`, `paused`: booleans | Default slot; `ready` event with controller or null; exposed `element`, `controller` |
| `Button` | `variant`: primary / secondary; `type`: button / submit / reset | Default slot; native attributes and events pass through |
| `NavItem` | `selected`: boolean; optional `href` | Default slot; button by default, anchor with `href`; active-page accessibility and circuit decoration |
| `Panel` | `accent`: CSS color | Default slot; exposed `element`; pre-rendered arrival decoration |
| `Signal` | Optional unique, stable `id` | Three-node signal ornament |
| `Identity` | Optional unique, stable `id` | Geometric heading ornament |

Use ordinary theme classes for layout and content. These primitives do not supply application routing, data storage, timers, or transcript grouping. The example intentionally uses a three-line readout; apply your own character and time boundaries to source calls in a real application.

`Theme` creates the controller only in `onMounted`, watches its preference props, and destroys it in `onBeforeUnmount`. Server rendering always emits stopped motion. The controller respects reduced motion, hidden documents, focus mode, glow-off, and paused state. Decorative HTML comes only from the trusted core SVG functions; user content stays in Vue slots and escaped text bindings. `Signal` and `Identity` use Vue's SSR-stable `useId()` by default. Explicit IDs must begin with a letter and contain only letters, numbers, `_`, or `-`; give each ornament instance its own ID.

## Nuxt integration

Add the stylesheet and transpile entry to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['@neon-grid/kit-core/theme.css'],
  build: { transpile: ['@neon-grid/kit-vue'] },
});
```

Import the components directly, or register the optional typed plugin in `app/plugins/neon-grid.ts`:

```ts
import { NeonGridPlugin } from '@neon-grid/kit-vue/plugin';
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(NeonGridPlugin);
});
```

The plugin registers `NgTheme`, `NgButton`, `NgNavItem`, `NgPanel`, `NgSignal`, and `NgIdentity`. Keep this universal plugin (no `.client` suffix): the components support SSR and render the same stopped decorative markup on server and client. The app does not need `ClientOnly`.

Run from the kit root after root installation:

```sh
npm run check --workspace @neon-grid/kit-vue
npm run build --workspace @neon-grid/example-vue
npm run check --workspace @neon-grid/example-nuxt
npm run build --workspace @neon-grid/example-nuxt
```

Implementation references: [Vue mount and cleanup hooks](https://vuejs.org/api/composition-api-lifecycle.html), [Vue stable IDs](https://vuejs.org/api/composition-api-helpers.html#useid), and [Nuxt universal plugins](https://nuxt.com/docs/4.x/guide/directory-structure/app/plugins).
