<script setup lang="ts">
/**
 * NgActionMenu — overflow menu on Reka UI's DropdownMenu.
 *
 * REPLACES a real accessibility hole. The petite-vue source used a raw
 * `<details class="action-menu"><summary class="btn">`, which is a disclosure
 * widget wearing a menu's clothes: no `role="menu"`, no arrow-key navigation,
 * no Esc-to-close, no focus return to the trigger. It also had to open UPWARD to
 * escape the ancestor card's `overflow: hidden`. Reka portals the panel to the
 * body, so that hack goes too and the menu can open in whichever direction fits.
 */
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'

export interface NgMenuItem {
  key: string
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean
  /** Renders a separator above this item. */
  separatorBefore?: boolean
}

withDefaults(
  defineProps<{
    items: NgMenuItem[]
    /** Group heading above the items. */
    heading?: string
    triggerIcon?: string
    triggerLabel?: string
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'right' | 'bottom' | 'left'
  }>(),
  { heading: undefined, triggerIcon: 'ph:dots-three', triggerLabel: 'More actions', align: 'end', side: 'bottom' },
)

const emit = defineEmits<{ select: [key: string] }>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button class="btn btn-ghost btn-icon" type="button" :title="triggerLabel">
        <NgIcon :name="triggerIcon" />
        <span class="sr-only">{{ triggerLabel }}</span>
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent class="am-panel" :align="align" :side="side" :side-offset="6">
        <DropdownMenuLabel v-if="heading" class="am-label">{{ heading }}</DropdownMenuLabel>
        <template v-for="item in items" :key="item.key">
          <DropdownMenuSeparator v-if="item.separatorBefore" class="am-sep" />
          <DropdownMenuItem
            class="am-item"
            :class="{ danger: item.danger }"
            :disabled="item.disabled"
            @select="emit('select', item.key)"
          >
            <NgIcon v-if="item.icon" :name="item.icon" />
            {{ item.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
