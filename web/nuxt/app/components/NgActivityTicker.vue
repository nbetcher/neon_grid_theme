<script setup lang="ts">
/** NgActivityTicker — one-line "what is happening right now", with a pulsing tick. */
withDefaults(defineProps<{ text?: string; icon?: string }>(), { text: undefined, icon: 'ph:caret-right' })
</script>

<template>
  <div class="activity-ticker">
    <NgIcon class="at-tick" :name="icon" />
    <span class="at-text"><slot>{{ text }}</slot></span>
  </div>
</template>
