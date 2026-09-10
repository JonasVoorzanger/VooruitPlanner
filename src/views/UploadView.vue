<template>
  <v-container class="py-6">
    <div class="page-shell d-flex flex-column ga-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Upload & conversie</h1>
        <p class="text-body-1 text-medium-emphasis">
          Upload een PDF of DOCX en laat Claude de inhoud omzetten naar CSV voor de gewenste spreadsheet-tabbladen.
        </p>
      </div>

      <v-card rounded="xl">
        <v-card-text class="d-flex flex-column ga-5">
          <v-file-input
            v-model="selectedFile"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            label="Upload PDF of Word-bestand"
            prepend-icon="mdi-paperclip"
            show-size
          />

          <v-autocomplete
            v-model="selectedTabs"
            :items="tabOptions"
            chips
            closable-chips
            item-title="title"
            item-value="value"
            label="Doeltabs voor CSV-export"
            multiple
            prepend-inner-icon="mdi-table-multiple"
          />

          <v-text-field
            v-model="claudeApiUrl"
            label="Claude API endpoint"
            prepend-inner-icon="mdi-api"
            placeholder="https://api.anthropic.com/v1/messages"
          />

          <v-text-field
            v-model="claudeApiKey"
            label="Claude API key"
            prepend-inner-icon="mdi-key-variant"
            type="password"
          />

          <div class="d-flex flex-wrap ga-3">
            <v-btn color="primary" :loading="isConverting" prepend-icon="mdi-auto-fix" @click="convertDocument">
              Converteer naar CSV
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-content-copy" :disabled="!output" @click="copyOutput">
              Kopieer resultaat
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-download" :disabled="!output" @click="downloadOutput">
              Download resultaat
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      <v-alert v-if="statusMessage" type="success" variant="tonal">{{ statusMessage }}</v-alert>

      <v-card rounded="xl">
        <v-card-item title="CSV-resultaat" subtitle="Controleer en kopieer het resultaat voordat je het in de spreadsheet plakt." />
        <v-card-text>
          <v-textarea
            v-model="output"
            auto-grow
            base-color="primary"
            min-rows="14"
            placeholder="Het Claude-resultaat verschijnt hier..."
            variant="outlined"
          />
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import * as mammoth from 'mammoth'
import { useSettingsStore } from '../stores/settings'
import { captureEvent, captureException } from '../utils/analytics'

const tabDefinitions = {
  weeks: 'week_number,start_date,end_date,label',
  events: 'date,description,year_1,year_2,year_3,year_4,year_5,year_6',
  subjects: 'abbreviation,full_name',
  tests: 'cal_year,cal_week_number,type,weight,subject_abbreviation,year,label,description',
  week_descriptions: 'subject_abbreviation,year,cal_year,cal_week_number,description',
}

export default {
  name: 'UploadView',
  data() {
    const settingsStore = useSettingsStore()

    return {
      settingsStore,
      selectedFile: null,
      selectedTabs: ['tests'],
      claudeApiUrl: settingsStore.claudeApiUrl,
      claudeApiKey: settingsStore.claudeApiKey,
      isConverting: false,
      output: '',
      error: '',
      statusMessage: '',
    }
  },
  computed: {
    activeFile() {
      return Array.isArray(this.selectedFile) ? this.selectedFile[0] || null : this.selectedFile
    },
    tabOptions() {
      return Object.keys(tabDefinitions).map((tabName) => ({
        title: `${tabName} (${tabDefinitions[tabName]})`,
        value: tabName,
      }))
    },
  },
  methods: {
    persistApiSettings() {
      this.settingsStore.saveSettings({
        claudeApiUrl: this.claudeApiUrl,
        claudeApiKey: this.claudeApiKey,
      })
    },
    async readFileAsBase64(file) {
      const buffer = await file.arrayBuffer()
      let binary = ''
      const bytes = new Uint8Array(buffer)
      const chunkSize = 0x8000

      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
      }

      return btoa(binary)
    },
    async buildRequestBody() {
      const prompt = this.buildPrompt()
      const file = this.activeFile

      if (file.name.toLowerCase().endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })

        return {
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${prompt}\n\nDocumenttekst:\n${result.value}`,
                },
              ],
            },
          ],
        }
      }

      const base64Data = await this.readFileAsBase64(file)
      return {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: file.type || 'application/pdf',
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }
    },
    buildPrompt() {
      const requestedTabs = this.selectedTabs
        .map((tabName) => `- ${tabName}: ${tabDefinitions[tabName]}`)
        .join('\n')

      return [
        'Analyseer dit schooldocument en zet de informatie om naar CSV voor de onderstaande Google Spreadsheet-tabbladen.',
        'Gebruik exact de gevraagde kolomnamen en laat kolommen leeg als de bron geen waarde bevat.',
        'Als meerdere tabbladen zijn geselecteerd, structureer het antwoord dan per tabblad met een kopregel in de vorm ### tab_naam gevolgd door alleen CSV-data.',
        'Gebruik geen extra uitleg buiten de gevraagde tabbladen en CSV-blokken.',
        '',
        'Gevraagde tabbladen:',
        requestedTabs,
      ].join('\n')
    },
    extractResponseText(payload) {
      if (payload.error && payload.error.message) {
        throw new Error(payload.error.message)
      }

      if (Array.isArray(payload.content)) {
        return payload.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join('\n\n')
      }

      return ''
    },
    async convertDocument() {
      this.error = ''
      this.statusMessage = ''

      if (!this.activeFile) {
        this.error = 'Kies eerst een PDF- of DOCX-bestand.'
        return
      }

      if (!this.selectedTabs.length) {
        this.error = 'Selecteer minimaal één doeltab.'
        return
      }

      if (!this.claudeApiUrl || !this.claudeApiKey) {
        this.error = 'Vul zowel een Claude API endpoint als API key in.'
        return
      }

      this.isConverting = true
      this.persistApiSettings()

      try {
        const requestBody = await this.buildRequestBody()
        const response = await fetch(this.claudeApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify(requestBody),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || `Claude API request mislukt (${response.status})`)
        }

        this.output = this.extractResponseText(data)
        captureEvent('document_conversion_completed', {
          file_type: this.activeFile.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
          tab_count: this.selectedTabs.length,
          selected_tabs: [...this.selectedTabs],
        })
        this.statusMessage = 'Conversie voltooid. Controleer de CSV-uitvoer hieronder.'
      } catch (error) {
        const properties = {
          file_type: this.activeFile.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
          tab_count: this.selectedTabs.length,
        }
        captureEvent('document_conversion_failed', properties)
        captureException(error, { flow: 'document_conversion', ...properties })
        this.error = error.message || 'Conversie mislukt.'
      } finally {
        this.isConverting = false
      }
    },
    async copyOutput() {
      await navigator.clipboard.writeText(this.output)
      this.statusMessage = 'CSV-resultaat gekopieerd naar het klembord.'
    },
    downloadOutput() {
      const blob = new Blob([this.output], { type: 'text/plain;charset=utf-8' })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'periodeplanner-export.txt'
      link.click()
      URL.revokeObjectURL(objectUrl)
      this.statusMessage = 'Download gestart.'
    },
  },
}
</script>
