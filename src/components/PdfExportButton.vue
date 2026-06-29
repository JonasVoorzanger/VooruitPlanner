<template>
  <v-btn :loading="isExporting" color="primary" prepend-icon="mdi-file-pdf-box" @click="exportPdf">
    Exporteer PDF
  </v-btn>
</template>

<script>
import html2pdf from 'html2pdf.js'

export default {
  name: 'PdfExportButton',
  props: {
    targetSelector: {
      type: String,
      default: '#planner-content',
    },
    fileName: {
      type: String,
      default: 'periodeplanner.pdf',
    },
  },
  emits: ['error'],
  data() {
    return {
      isExporting: false,
    }
  },
  methods: {
    async exportPdf() {
      const targetElement = document.querySelector(this.targetSelector)

      if (!targetElement) {
        this.$emit('error', 'Kon de plannerweergave niet vinden om te exporteren.')
        return
      }

      this.isExporting = true

      try {
        await html2pdf()
          .set({
            margin: 10,
            filename: this.fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] },
          })
          .from(targetElement)
          .save()
      } catch (error) {
        this.$emit('error', error.message || 'PDF exporteren mislukt.')
      } finally {
        this.isExporting = false
      }
    },
  },
}
</script>
