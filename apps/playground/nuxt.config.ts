import { packageAliases } from '../../aliases'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  alias: packageAliases,
  css: ['@art-widgets/ui/fonts.css', '@art-widgets/ui/tokens.css', '~/assets/page.css'],
  app: {
    head: {
      title: 'Art Widgets',
      meta: [{ name: 'color-scheme', content: 'dark' }],
    },
  },
})
