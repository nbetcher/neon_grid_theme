export default defineNuxtConfig({
  compatibilityDate: '2026-09-08',
  devtools: { enabled: false },
  css: ['@neon-grid/kit-core/theme.css'],
  build: { transpile: ['@neon-grid/kit-vue'] },
  app: {
    head: {
      title: 'Neon Grid · Nuxt template',
      htmlAttrs: { lang: 'en' },
      bodyAttrs: { style: 'margin:0' },
      meta: [{ name: 'theme-color', content: '#0a0a12' }],
    },
  },
});
