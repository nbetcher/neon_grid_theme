import { inject, type InjectionKey, type ShallowRef } from 'vue';
import type { ThemeController } from '@neon-grid/kit-core';

export const neonThemeKey: InjectionKey<ShallowRef<ThemeController | null>> = Symbol('neon-grid-theme');

/** Available to descendants of Theme. The reference is null before mounting and after disposal. */
export function useNeonTheme(): Readonly<ShallowRef<ThemeController | null>> {
  const controller = inject(neonThemeKey);
  if (!controller) throw new Error('useNeonTheme must be used within a Neon Grid Theme component.');
  return controller;
}
