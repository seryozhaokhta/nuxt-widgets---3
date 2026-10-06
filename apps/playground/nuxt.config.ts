import { fileURLToPath } from 'node:url'
import { packageAliases } from '../../aliases'

// The app lives in apps/playground, but Vercel builds from the repository root
// and expects its Build Output API files in <root>/.vercel/output.
const vercelOutput = process.env.VERCEL
  ? { output: { dir: fileURLToPath(new URL('../../.vercel/output', import.meta.url)) } }
  : {}

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
  nitro: vercelOutput,
})
