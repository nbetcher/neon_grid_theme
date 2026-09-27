/**
 * Installs the glow/contrast state on the client even if the app never renders
 * <NgAppShell>.
 *
 * The ACTUAL pre-paint work is done by the inline head script declared in the
 * layer's `nuxt.config.ts` — a Nuxt plugin runs after the first paint, which
 * would produce one frame at the wrong glow level and then a visible snap on a
 * page made entirely of glowing panels. This plugin only makes the reactive
 * mirror exist; it must never be the thing that sets the attribute first.
 */
export default defineNuxtPlugin(() => {
  useGlowLevel()
})
