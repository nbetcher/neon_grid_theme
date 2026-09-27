<script setup lang="ts">
/**
 * NgTabs — Reka Tabs with the Neon Grid tab rail.
 *
 * Roving tabindex, arrow-key navigation and the `aria-controls`/`aria-labelledby`
 * wiring come from Reka. Content goes in a named slot per tab value.
 *
 *   <NgTabs v-model="tab" :tabs="[{value:'transcript',label:'Transcript'}]">
 *     <template #transcript> ... </template>
 *   </NgTabs>
 */
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

export interface NgTab {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

defineProps<{ tabs: NgTab[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <TabsRoot v-model="model">
    <TabsList class="ng-tabs-list">
      <TabsTrigger v-for="t in tabs" :key="t.value" class="ng-tab" :value="t.value" :disabled="t.disabled">
        <NgIcon v-if="t.icon" :name="t.icon" />
        {{ t.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="t in tabs" :key="t.value" :value="t.value">
      <slot :name="t.value" />
    </TabsContent>
  </TabsRoot>
</template>
