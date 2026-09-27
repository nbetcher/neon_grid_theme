import { NeonGridPlugin } from '@neon-grid/kit-vue/plugin';

// Universal registration: SSR produces the same stopped decorations as hydration.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(NeonGridPlugin);
});
