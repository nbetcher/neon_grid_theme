import type { Plugin } from 'vue';
import { Theme, Button, NavItem, Panel, Signal, Identity } from './index';

/** Optional Vue plugin. Install in a Nuxt universal plugin; components remain SSR safe. */
export const NeonGridPlugin: Plugin = {
  install(app) {
    app.component('NgTheme', Theme);
    app.component('NgButton', Button);
    app.component('NgNavItem', NavItem);
    app.component('NgPanel', Panel);
    app.component('NgSignal', Signal);
    app.component('NgIdentity', Identity);
  },
};

declare module 'vue' {
  export interface GlobalComponents {
    NgTheme: typeof Theme;
    NgButton: typeof Button;
    NgNavItem: typeof NavItem;
    NgPanel: typeof Panel;
    NgSignal: typeof Signal;
    NgIdentity: typeof Identity;
  }
}
