<template>
  <v-container class="py-6">
    <div class="page-shell d-flex flex-column ga-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Instellingen</h1>
        <p class="text-body-1 text-medium-emphasis">
          Beheer de Claude API-configuratie voor de uploadpagina. Alle instellingen worden lokaal in je browser opgeslagen.
        </p>
      </div>

      <v-card rounded="xl">
        <v-card-text class="d-flex flex-column ga-5">
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
          </div>
        </v-card-text>
      </v-card>

      <v-alert v-if="message" :type="messageType" variant="tonal">{{ message }}</v-alert>
    </div>
  </v-container>
</template>

<script>
import { useSettingsStore } from '../stores/settings'

export default {
  name: 'SettingsView',
  data() {
    const settingsStore = useSettingsStore()

    return {
      settingsStore,
      claudeApiUrl: settingsStore.claudeApiUrl,
      claudeApiKey: settingsStore.claudeApiKey,
      message: '',
      messageType: 'success',
    }
  },
  methods: {
    saveSettings() {
      this.settingsStore.saveSettings({
        claudeApiUrl: this.claudeApiUrl,
        claudeApiKey: this.claudeApiKey,
      })
      this.message = 'Instellingen opgeslagen.'
      this.messageType = 'success'
    },
  },
}
</script>
