<template>
  <div class="backdrop" @click.self="close">
    <div class="panel" role="dialog" aria-modal="true" aria-label="Feedback geven">
      <button class="close" aria-label="Sluiten" @click="close">
        <span class="mdi mdi-close" aria-hidden="true"></span>
      </button>

      <div class="head">
        <span class="mdi mdi-message-text-outline" aria-hidden="true"></span>
        <h2 class="title">Zie je iets wat anders of beter kan?</h2>
      </div>

      <p class="text">Laat het ons weten!</p>

      <FeedbackForm class="form-slot" :context="context" :rows="5" @sent="onSent" @cancel="close" />
    </div>
  </div>
</template>

<script>
import FeedbackForm from './FeedbackForm.vue'

export default {
  name: 'FeedbackDialog',
  components: {
    FeedbackForm,
  },
  props: {
    context: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['close'],
  data() {
    return {
      closeTimer: null,
    }
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    onSent() {
      // Even het bedankje laten staan, dan zichzelf opruimen.
      this.closeTimer = setTimeout(this.close, 1600)
    },
    onKeydown(event) {
      if (event.key === 'Escape') {
        this.close()
      }
    },
  },
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: color-mix(in oklab, var(--bg) 30%, black 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
}

.panel {
  position: relative;
  width: 520px;
  max-width: 100%;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 20px 20px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  animation: pp-pop 0.18s ease both;
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.close:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  /* Ruimte rechts houdt de sluitknop vrij. */
  padding-right: 40px;
}

.head .mdi {
  font-size: 21px;
  line-height: 1;
  color: var(--accent);
}

.title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.text {
  margin: 6px 0 14px;
  font-size: 14px;
  color: var(--muted);
}

.form-slot {
  display: block;
}

@media (max-width: 600px) {
  .backdrop {
    padding: 0;
    align-items: stretch;
  }

  .panel {
    width: 100%;
    max-height: none;
    border: none;
    border-radius: 0;
    padding-top: 24px;
  }
}
</style>
