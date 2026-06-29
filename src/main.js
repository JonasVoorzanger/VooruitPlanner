import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
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

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
