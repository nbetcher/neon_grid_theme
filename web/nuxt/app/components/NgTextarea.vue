<script setup lang="ts">
/** NgTextarea — `.tron-textarea`, vertical resize only, min-height 70px. */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    bare?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    placeholder: undefined,
    rows: 3,
    disabled: false,
    bare: false,
  },
)

const model = defineModel<string>()
const id = useId()
const hintId = computed(() => (props.hint ? `${id}-hint` : undefined))
const errId = computed(() => (props.error ? `${id}-err` : undefined))
const describedBy = computed(() => [errId.value, hintId.value].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div :class="bare ? undefined : 'form-group'">
    <label v-if="label" class="form-label" :for="id">{{ label }}</label>
    <textarea
      :id="id"
      v-model="model"
      class="tron-textarea"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
    />
    <p v-if="error" :id="errId" class="form-error">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="form-hint">{{ hint }}</p>
  </div>
</template>
