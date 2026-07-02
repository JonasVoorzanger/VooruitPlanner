import { defineStore } from 'pinia'

const STORAGE_KEYS = {
  claudeApiUrl: 'periodeplanner.claudeApiUrl',
  claudeApiKey: 'periodeplanner.claudeApiKey',
}

const DEFAULT_CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

function readStorage(key) {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(key) || ''
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, value || '')
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    claudeApiUrl: readStorage(STORAGE_KEYS.claudeApiUrl) || DEFAULT_CLAUDE_API_URL,
    claudeApiKey: readStorage(STORAGE_KEYS.claudeApiKey),
  }),
  actions: {
    persist() {
      writeStorage(STORAGE_KEYS.claudeApiUrl, this.claudeApiUrl)
      writeStorage(STORAGE_KEYS.claudeApiKey, this.claudeApiKey)
    },
    loadSettings() {
      this.claudeApiUrl = readStorage(STORAGE_KEYS.claudeApiUrl) || DEFAULT_CLAUDE_API_URL
      this.claudeApiKey = readStorage(STORAGE_KEYS.claudeApiKey)
    },
    saveSettings(payload = {}) {
      if (Object.prototype.hasOwnProperty.call(payload, 'claudeApiUrl')) {
        this.claudeApiUrl = payload.claudeApiUrl || ''
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'claudeApiKey')) {
        this.claudeApiKey = payload.claudeApiKey || ''
      }

      this.persist()
    },
  },
})
