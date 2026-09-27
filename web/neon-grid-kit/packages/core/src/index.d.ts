export type Glow = 'balanced' | 'subtle' | 'off';
export interface ThemeOptions { glow?: Glow; motion?: boolean; focus?: boolean; paused?: boolean; }
export interface ThemeController {
  update(options: ThemeOptions): void;
  pulse(panel: HTMLElement): boolean;
  destroy(): void;
}
export interface ThemeState extends Required<ThemeOptions> { ambient: 'running' | 'stopped'; reason: string; }
export declare function createThemeController(root: HTMLElement, options?: ThemeOptions): ThemeController;
export declare function navMarkup(): string;
export declare function signalMarkup(id: string): string;
export declare function identityMarkup(id: string): string;
