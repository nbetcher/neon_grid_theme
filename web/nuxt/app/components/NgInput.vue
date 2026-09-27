<script setup lang="ts">
/** NgInput — `.tron-input` with a label, hint and error wired to aria-describedby. */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    /** No .form-group wrapper — for use inside .filters-row / .toolbar-row. */
    bare?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    type: 'text',
    placeholder: undefined,
    disabled: false,
    required: false,
    bare: false,
  },
)

const model = defineModel<string | number>()
const id = useId()
const hintId = computed(() => (props.hint ? `${id}-hint` : undefined))
const errId = computed(() => (props.error ? `${id}-err` : undefined))
const describedBy = computed(() => [errId.value, hintId.value].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div :class="bare ? undefined : 'form-group'">
    <label v-if="label" class="form-label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="tron-input"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
    >
    <p v-if="error" :id="errId" class="form-error">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="form-hint">{{ hint }}</p>
  </div>
</template>
