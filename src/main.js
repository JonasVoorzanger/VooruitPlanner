import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import posthog from 'posthog-js'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import router from './router'
import './style.css'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'schoolLight',
    themes: {
      schoolLight: {
        dark: false,
        colors: {
          primary: '#1f5fa7',
          secondary: '#4f7cac',
          accent: '#f2a65a',
          success: '#4caf50',
          info: '#2196f3',
          warning: '#fb8c00',
          error: '#e53935',
          background: '#f5f7fb',
          surface: '#ffffff',
        },
      },
    },
  },
})

const posthogProjectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const posthogHost = import.meta.env.VITE_POSTHOG_HOST

if (import.meta.env.DEV && !posthogProjectToken) {
  throw new Error(
    'VITE_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_PROJECT_TOKEN is configured',
  )
}

if (import.meta.env.DEV && !posthogHost) {
  throw new Error(
    'VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured',
  )
}

const posthogEnabled = Boolean(posthogProjectToken && posthogHost)
if (posthogEnabled) {
  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
  })
}

const app = createApp(App)
app.config.errorHandler = (error, instance, info) => {
  if (posthogEnabled) {
    posthog.captureException(error, { vue_error_info: info })
  }
  console.error(error)
}
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
