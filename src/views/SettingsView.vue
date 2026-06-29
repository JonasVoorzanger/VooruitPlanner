<template>
  <v-container class="py-6">
    <div class="page-shell d-flex flex-column ga-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Instellingen</h1>
        <p class="text-body-1 text-medium-emphasis">
          Beheer de Google Spreadsheet-bron en de Claude API-configuratie. Alle instellingen worden lokaal in je browser opgeslagen.
        </p>
      </div>

      <v-card rounded="xl">
        <v-card-text class="d-flex flex-column ga-5">
          <SpreadsheetConfig
            v-model="spreadsheetUrl"
            :show-save-button="false"
          />

          <v-text-field
            v-model="claudeApiUrl"
            label="Claude API endpoint"
            placeholder="https://api.anthropic.com/v1/messages"
            prepend-inner-icon="mdi-api"
          />

          <v-text-field
            v-model="claudeApiKey"
            label="Claude API key"
            prepend-inner-icon="mdi-key-variant"
            type="password"
          />

          <v-alert type="info" variant="tonal" density="comfortable">
            De Claude API key wordt lokaal in deze browser opgeslagen om de uploadpagina opnieuw te kunnen gebruiken.
          </v-alert>

          <div class="d-flex flex-wrap ga-3">
            <v-btn color="primary" prepend-icon="mdi-content-save-outline" @click="saveSettings">
              Opslaan
            </v-btn>
            <v-btn color="secondary" prepend-icon="mdi-connection" :loading="isTesting" @click="testConnection">
              Test verbinding
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-alert v-if="message" :type="messageType" variant="tonal">{{ message }}</v-alert>
    </div>
  </v-container>
</template>

<script>
import SpreadsheetConfig from '../components/SpreadsheetConfig.vue'
import { useSettingsStore } from '../stores/settings'
import { useSpreadsheetStore } from '../stores/spreadsheet'

export default {
  name: 'SettingsView',
  components: {
    SpreadsheetConfig,
  },
  data() {
    const settingsStore = useSettingsStore()

    return {
      settingsStore,
      spreadsheetStore: useSpreadsheetStore(),
      spreadsheetUrl: settingsStore.spreadsheetUrl,
      claudeApiUrl: settingsStore.claudeApiUrl,
      claudeApiKey: settingsStore.claudeApiKey,
      isTesting: false,
      message: '',
      messageType: 'success',
    }
  },
  methods: {
    saveSettings() {
      this.settingsStore.saveSettings({
        spreadsheetUrl: this.spreadsheetUrl,
        claudeApiUrl: this.claudeApiUrl,
        claudeApiKey: this.claudeApiKey,
      })
      this.message = 'Instellingen opgeslagen.'
      this.messageType = 'success'
    },
    async testConnection() {
      this.saveSettings()
      this.isTesting = true
      this.message = ''

      try {
        await this.spreadsheetStore.fetchAllData(this.spreadsheetUrl)
        this.message = 'Verbinding succesvol. Alle tabbladen zijn geladen.'
        this.messageType = 'success'
      } catch (error) {
        this.message = error.message || 'Verbinding testen mislukt.'
        this.messageType = 'error'
      } finally {
        this.isTesting = false
      }
    },
  },
}
</script>
