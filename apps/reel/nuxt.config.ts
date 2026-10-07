import { fileURLToPath } from 'node:url'
import { packageAliases } from '../../aliases'

// Promo reels of the mechanics: each variant is a page whose every frame is a
// function of time; tools/reel/render.mjs steps through it and encodes video.
// Images, map layers and data are shared with the playground.
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  ssr: false,
  devtools: { enabled: false },
  alias: {
    ...packageAliases,
    '~data': fileURLToPath(new URL('../playground/data', import.meta.url)),
  },
  dir: { public: fileURLToPath(new URL('../playground/public', import.meta.url)) },
  css: ['@art-widgets/ui/fonts.css', '@art-widgets/ui/tokens.css', '~/assets/reel.css'],
  devServer: { port: 3100 },
  app: {
    head: {
      title: 'Art Widgets — reels',
      meta: [{ name: 'color-scheme', content: 'dark' }],
    },
  },
})
