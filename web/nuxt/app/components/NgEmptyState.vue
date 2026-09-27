<script setup lang="ts">
/**
 * NgEmptyState — big dim icon, one line, optional actions.
 *
 * `tone` recolours the icon. Default is the dim border colour (a genuinely empty
 * list). Use a tone when the emptiness MEANS something — `violet` for "this view
 * has no coverage here", `warn` for "the source is dark, so of course there is
 * nothing", `danger` for "this failed". On a monitoring console, "nothing to
 * show" and "nothing arrived because we are blind" must not look identical.
 */
withDefaults(
  defineProps<{
    icon?: string
    message?: string
    tone?: 'default' | 'violet' | 'warn' | 'danger' | 'ok'
  }>(),
  { icon: 'ph:tray', message: 'Nothing here.', tone: 'default' },
)
</script>

<template>
  <div class="empty-state" :class="tone !== 'default' ? `tone-${tone}` : undefined">
    <NgIcon :name="icon" />
    <p><slot>{{ message }}</slot></p>
    <div v-if="$slots.actions" class="empty-actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.tone-violet .ng-icon {
  color: var(--violet);
}
.tone-warn .ng-icon {
  color: var(--orange);
}
.tone-danger .ng-icon {
  color: var(--red);
}
.tone-ok .ng-icon {
  color: var(--green);
}
</style>
