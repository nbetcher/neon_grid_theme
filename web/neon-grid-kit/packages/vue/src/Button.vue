<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'secondary'; type?: 'button' | 'submit' | 'reset' }>(), {
  variant: 'secondary', type: 'button',
});
</script>

<template>
  <button :type="type" class="button" :class="variant"><slot /></button>
</template>
