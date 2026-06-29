import { defineStore } from 'pinia'

const STORAGE_KEYS = {
  spreadsheetUrl: 'periodeplanner.spreadsheetUrl',
  claudeApiUrl: 'periodeplanner.claudeApiUrl',
  claudeApiKey: 'periodeplanner.claudeApiKey',
}

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

export function extractSpreadsheetId(value) {
  if (!value) {
    return ''
  }

  const trimmedValue = value.trim()
  const match = trimmedValue.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)

  if (match) {
    return match[1]
  }

  if (/^[a-zA-Z0-9-_]+$/.test(trimmedValue)) {
    return trimmedValue
  }

  return ''
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    spreadsheetUrl: readStorage(STORAGE_KEYS.spreadsheetUrl),
    claudeApiUrl: readStorage(STORAGE_KEYS.claudeApiUrl),
    claudeApiKey: readStorage(STORAGE_KEYS.claudeApiKey),
  }),
  getters: {
    spreadsheetId(state) {
      return extractSpreadsheetId(state.spreadsheetUrl)
    },
  },
  actions: {
    persist() {
      writeStorage(STORAGE_KEYS.spreadsheetUrl, this.spreadsheetUrl)
      writeStorage(STORAGE_KEYS.claudeApiUrl, this.claudeApiUrl)
      writeStorage(STORAGE_KEYS.claudeApiKey, this.claudeApiKey)
    },
    loadSettings() {
      this.spreadsheetUrl = readStorage(STORAGE_KEYS.spreadsheetUrl)
      this.claudeApiUrl = readStorage(STORAGE_KEYS.claudeApiUrl)
      this.claudeApiKey = readStorage(STORAGE_KEYS.claudeApiKey)
    },
    saveSettings(payload = {}) {
      if (Object.prototype.hasOwnProperty.call(payload, 'spreadsheetUrl')) {
        this.spreadsheetUrl = payload.spreadsheetUrl || ''
      }

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
