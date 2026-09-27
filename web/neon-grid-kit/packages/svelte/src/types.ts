import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { ThemeController, ThemeOptions } from '@neon-grid/kit-core';

export interface ThemeStateDetail {
  ambient: 'running' | 'stopped';
  reason: string;
}

export type ThemeProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & ThemeOptions & {
  class?: string;
  children?: Snippet;
  onController?: (controller: ThemeController | null) => void;
  onStateChange?: (event: CustomEvent<ThemeStateDetail>) => void;
};

export type ButtonProps = Omit<HTMLButtonAttributes, 'children' | 'class'> & {
  class?: string;
  children?: Snippet;
  variant?: 'primary' | 'secondary';
};

export type NavItemProps = Omit<HTMLButtonAttributes, 'children' | 'class'> & {
  class?: string;
  children?: Snippet;
  selected?: boolean;
};

export type PanelProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'> & {
  class?: string;
  children?: Snippet;
  color?: string;
  element?: HTMLElement | null;
};

/** Optional explicit SVG prefix must be unique and match [A-Za-z][A-Za-z0-9_-]*. */
export interface DecorationProps { id?: string }
