<script setup lang="ts">
/**
 * NgIcon — the single place this theme touches an icon system.
 *
 * Delegates to `<Icon>` from `@nuxt/icon` in `mode: 'svg'` with
 * `clientBundle.scan`, so every icon used anywhere in the app is baked into the
 * bundle and NOTHING is resolved over the network. That matters: this console
 * has to render correctly on a LAN with the internet down.
 *
 * If you want a different icon system, override THIS ONE FILE in your app's
 * `app/components/NgIcon.vue` — layer priority puts your copy first and every
 * other Neon Grid component picks it up. That is the whole reason the theme
 * never calls `<Icon>` directly anywhere else.
 *
 * Accepts both vocabularies:
 *   `ph:cpu`   Iconify (preferred)
 *   `ph-cpu`   the phosphor-icons CSS class name used by the petite-vue source,
 *              so markup copied across from the showcase keeps working.
 */
const props = withDefaults(
  defineProps<{
    /** `ph:cpu` or legacy `ph-cpu`. */
    name: string
    /** CSS size; anything valid for font-size. */
    size?: string
    /** Accessible label. Omit for purely decorative icons (the default). */
    label?: string
  }>(),
  { size: undefined, label: undefined },
)

/** `ph-arrow-clockwise` → `ph:arrow-clockwise`. Already-namespaced names pass through. */
const iconName = computed(() => {
  const n = props.name
  if (n.includes(':')) return n
  const i = n.indexOf('-')
  return i > 0 ? `${n.slice(0, i)}:${n.slice(i + 1)}` : n
})
</script>

<template>
  <Icon
    class="ng-icon"
    :name="iconName"
    :style="size ? { fontSize: size } : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
  />
</template>

<style scoped>
.ng-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.125em;
}
</style>
