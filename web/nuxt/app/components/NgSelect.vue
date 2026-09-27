<script setup lang="ts">
/**
 * NgSelect — `.tron-select`, a real native <select>.
 *
 * Deliberately native rather than a Reka Select: on a Windows console the OS
 * dropdown is keyboard-familiar, works under forced-colors, and cannot be
 * clipped by a modal's overflow. Reach for a Combobox instead when you need
 * search/multi-select (watch-term entry with suggestions).
 */
export interface NgSelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    options: NgSelectOption[]
    disabled?: boolean
    bare?: boolean
  }>(),
  { label: undefined, hint: undefined, disabled: false, bare: false },
)

const model = defineModel<string | number>()
const id = useId()
const hintId = computed(() => (props.hint ? `${id}-hint` : undefined))
</script>

<template>
  <div :class="bare ? undefined : 'form-group'">
    <label v-if="label" class="form-label" :for="id">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      class="tron-select"
      :disabled="disabled"
      :aria-describedby="hintId"
    >
      <option v-for="o in options" :key="o.value" :value="o.value" :disabled="o.disabled">
        {{ o.label }}
      </option>
    </select>
    <p v-if="hint" :id="hintId" class="form-hint">{{ hint }}</p>
  </div>
</template>
