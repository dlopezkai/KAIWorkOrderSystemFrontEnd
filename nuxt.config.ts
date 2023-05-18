import vuetify from 'vite-plugin-vuetify'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
      head: {
        title: 'Work Order System'
      }
    },
    runtimeConfig:{
      API_URL: 'https://kai.huberspace.net',
      public: {
        API_URL: 'https://kai.huberspace.net',
      }
    },
    modules: ['@pinia/nuxt', '@nuxt/image-edge'],
    css: ['vuetify/lib/styles/main.sass', '@mdi/font/css/materialdesignicons.min.css'],
    build: {
      transpile: ['vuetify', 'quill.client'],
    },
    vite: {
      define: {
        'process.env.DEBUG': false,
      },
    },
    hooks: {
        'vite:extendConfig': (config) => {
          config.plugins.push(
            vuetify({
              styles: { configFile: resolve('./settings.scss') },
            })
          )
        }
    }
})
