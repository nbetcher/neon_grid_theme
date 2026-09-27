<script setup lang="ts">
/**
 * NgModal — `.modal-content` on Reka UI's Dialog.
 *
 * The petite-vue original was a hand-rolled `.modal-backdrop` with
 * `@click.self` to close. It had no focus trap, no scroll lock, no Esc, no
 * focus restore and no `aria-modal`. Reka's Dialog supplies all five; the CSS
 * here is unchanged from the source.
 *
 * Sizes:
 *   sm       460px — confirmations
 *   md       760px — the default
 *   xl       65vw x 80vh, header/scroll/footer flex layout — record detail
 *   cockpit  88vw x 86vh, two-pane — the AI session viewer
 */
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    size?: 'sm' | 'md' | 'xl' | 'cockpit'
    /** Hide the corner close button (you must then provide your own way out). */
    noClose?: boolean
  }>(),
  { title: undefined, description: undefined, icon: undefined, size: 'md', noClose: false },
)

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="modal-backdrop" />
      <div class="modal-positioner">
        <DialogContent
          class="modal-content"
          :class="{
            'modal-sm': size === 'sm',
            'modal-xl': size === 'xl',
            'modal-cockpit': size === 'cockpit',
          }"
        >
          <DialogClose v-if="!noClose" class="modal-close" aria-label="Close">
            <NgIcon name="ph:x" />
          </DialogClose>

          <!-- xl/cockpit lay out their own header/scroll/footer via slots. -->
          <template v-if="size === 'xl' || size === 'cockpit'">
            <div :class="size === 'xl' ? 'mx-header' : 'ck-header'">
              <DialogTitle class="modal-title">
                <NgIcon v-if="icon" :name="icon" />
                <slot name="title">{{ title }}</slot>
              </DialogTitle>
              <DialogDescription v-if="description" class="modal-desc">{{ description }}</DialogDescription>
              <slot name="header" />
            </div>
            <slot />
            <div v-if="$slots.footer" class="mx-footer"><slot name="footer" /></div>
          </template>

          <template v-else>
            <DialogTitle class="modal-title">
              <NgIcon v-if="icon" :name="icon" />
              <slot name="title">{{ title }}</slot>
            </DialogTitle>
            <DialogDescription v-if="description" class="modal-desc">{{ description }}</DialogDescription>
            <slot />
            <div v-if="$slots.footer" class="btn-row"><slot name="footer" /></div>
          </template>
        </DialogContent>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
/* Reka needs a real element for the close button; the class comes from
   50-surfaces.css, this only removes the UA button chrome. */
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
}
/* The cockpit header shares the .mx-header geometry with extra row layout. */
.ck-header {
  padding: 16px 24px 14px;
  border-bottom: 1px solid rgba(0, 224, 255, 0.18);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  position: relative;
}
</style>
