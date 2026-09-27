<script setup lang="ts">
/**
 * NgRecordRow — the compact accordion row (`.issue-row` in the petite-vue
 * source, renamed to a domain-neutral name; the old classes remain as aliases so
 * ported markup still works).
 *
 * Real disclosure semantics: the head is a <button> with `aria-expanded` and
 * `aria-controls`, not a clickable <div>.
 */
const props = withDefaults(
  defineProps<{
    /** Left stripe colour — severity, agency, source. */
    stripe?: string
    /** Small square dot before the slug. */
    dotColor?: string
    slug?: string
    title?: string
    /** Initial state when the row is UNCONTROLLED (no v-model:open). */
    defaultOpen?: boolean
  }>(),
  { stripe: undefined, dotColor: undefined, slug: undefined, title: undefined, defaultOpen: false },
)

/**
 * Controlled / uncontrolled in one component: bind `v-model:open` to drive it
 * from a parent (e.g. "expand all"), or leave it off and the row manages itself.
 */
const open = defineModel<boolean | undefined>('open', { default: undefined })
const internal = ref(props.defaultOpen)
const isOpen = computed({
  get: () => open.value ?? internal.value,
  set: (v) => {
    if (open.value === undefined) internal.value = v
    else open.value = v
  },
})

const id = useId()
</script>

<template>
  <div class="ng-record-row" :data-open="String(isOpen)">
    <span v-if="stripe" class="istripe" :style="{ background: stripe }" />
    <button
      class="ng-record-head"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="id"
      @click="isOpen = !isOpen"
    >
      <span v-if="dotColor" class="issue-sev-dot" :style="{ background: dotColor }" />
      <span v-if="slug" class="issue-slug">{{ slug }}</span>
      <span v-if="title" class="issue-title">{{ title }}</span>
      <slot name="head" />
      <NgIcon class="issue-caret" name="ph:caret-down" />
    </button>
    <div v-show="isOpen" :id="id" class="ng-record-body">
      <slot />
    </div>
  </div>
</template>
