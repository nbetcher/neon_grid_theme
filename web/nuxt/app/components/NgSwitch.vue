<script setup lang="ts">
/** NgSwitch — Reka Switch with the cyan-glow track. */
import { SwitchRoot, SwitchThumb } from 'reka-ui'

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    disabled?: boolean
  }>(),
  { label: undefined, hint: undefined, disabled: false },
)

const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <div class="ng-switch-row">
    <SwitchRoot :id="id" v-model="model" class="ng-switch" :disabled="disabled">
      <SwitchThumb class="ng-switch-thumb" />
    </SwitchRoot>
    <label v-if="label" :for="id" class="ng-switch-label">
      {{ label }}
      <span v-if="hint" class="form-hint">{{ hint }}</span>
    </label>
  </div>
</template>

<style scoped>
.ng-switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ng-switch-label {
  font-size: 0.94rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
