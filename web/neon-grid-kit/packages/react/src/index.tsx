'use client';

import {
  createContext, forwardRef, useContext, useEffect, useId, useRef, useState,
  type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties,
  type HTMLAttributes, type ReactNode,
} from 'react';
import {
  createThemeController, identityMarkup, navMarkup, signalMarkup,
  type ThemeController, type ThemeOptions,
} from '@neon-grid/kit-core';

export type { ThemeController, ThemeOptions } from '@neon-grid/kit-core';

const ControllerContext = createContext<ThemeController | null>(null);
const classes = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(' ');

export interface ThemeProps extends HTMLAttributes<HTMLDivElement>, ThemeOptions {
  /** Called after mount, then with null on cleanup. Keep a stable callback when possible. */
  onController?: (controller: ThemeController | null) => void;
}

/** A scoped theme root. The controller is created after hydration and destroyed on unmount. */
export function Theme({
  glow = 'balanced', motion = true, focus = false, paused = false,
  onController, className, children, ...props
}: ThemeProps) {
  const root = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<ThemeController | null>(null);
  const latestOptions = useRef({ glow, motion, focus, paused });
  latestOptions.current = { glow, motion, focus, paused };

  useEffect(() => {
    const instance = createThemeController(root.current!, latestOptions.current);
    setController(instance);
    return () => instance.destroy();
  }, []);

  useEffect(() => { controller?.update({ glow, motion, focus, paused }); }, [controller, glow, motion, focus, paused]);
  useEffect(() => {
    if (!controller) return;
    onController?.(controller);
    return () => onController?.(null);
  }, [controller, onController]);

  return <div {...props} ref={root} className={classes('ng-theme', className)}
    data-glow={glow === 'off' ? 'off' : 'soft'}
    data-intensity={glow === 'subtle' ? 'subtle' : 'balanced'}
    data-ambient="stopped" data-reading={focus ? 'true' : 'false'}>
    <ControllerContext.Provider value={controller}>{children}</ControllerContext.Provider>
  </div>;
}

/** Null during SSR and the initial render; usable after Theme mounts. */
export function useThemeController() { return useContext(ControllerContext); }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', className, type = 'button', ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} className={classes('button', variant, className)} />;
});

interface NavBase { selected?: boolean; children?: ReactNode; className?: string }
export type NavItemProps = NavBase & (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
);

export function NavItem({ selected = false, className, children, ...props }: NavItemProps) {
  const contents = <><span className="nav-content">{children}</span><span className="ng-decoration" aria-hidden="true" dangerouslySetInnerHTML={{ __html: navMarkup() }} /></>;
  const shared = { className: classes('nav-item', selected && 'selected', className), 'data-ng-nav': '', 'aria-current': selected ? 'page' as const : undefined };
  if (typeof props.href === 'string') return <a {...props as AnchorHTMLAttributes<HTMLAnchorElement>} {...shared}>{contents}</a>;
  return <button {...props as ButtonHTMLAttributes<HTMLButtonElement>} type={(props as ButtonHTMLAttributes<HTMLButtonElement>).type ?? 'button'} {...shared}>{contents}</button>;
}

export interface PanelProps extends HTMLAttributes<HTMLElement> { color?: string }
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  { color = '#00e0ff', style, className, children, ...props }, ref,
) {
  return <article {...props} ref={ref} data-ng-panel="" className={classes('channel-card', className)}
    style={{ '--channel-color': color, ...style } as CSSProperties}>
    {children}<span className="arrival-field" data-ng-arrival="" aria-hidden="true" />
  </article>;
});

export interface DecorationProps { /** Unique, stable SVG gradient prefix; generated with useId if omitted. */ id?: string; className?: string }
function useDecorationId(id: string | undefined, kind: string) {
  const generated = useId();
  return id ?? `ng-react-${kind}-${generated.replace(/[^A-Za-z0-9_-]/g, '')}`;
}

export function Signal({ id, className }: DecorationProps) {
  const prefix = useDecorationId(id, 'signal');
  return <div className={classes('mini-timeline', className)} aria-hidden="true" dangerouslySetInnerHTML={{ __html: signalMarkup(prefix) }} />;
}

export function Identity({ id, className }: DecorationProps) {
  const prefix = useDecorationId(id, 'identity');
  return <span className={classes('ng-decoration', className)} aria-hidden="true" dangerouslySetInnerHTML={{ __html: identityMarkup(prefix) }} />;
}
