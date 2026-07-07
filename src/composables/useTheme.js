import { ref } from 'vue'

const STORAGE_KEY = 'plannerTheme'

const theme = ref(localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light')

function applyTheme() {
  document.documentElement.dataset.theme = theme.value
}

applyTheme()

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, theme.value)
    applyTheme()
  }

  return { theme, toggleTheme }
}
