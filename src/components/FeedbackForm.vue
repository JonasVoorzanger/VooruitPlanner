<template>
  <div class="wrap">
    <form v-if="state === 'open'" class="form" @submit.prevent="submit">
      <textarea
        ref="input"
        v-model="message"
        class="input"
        :rows="rows"
        maxlength="1000"
        aria-label="Je feedback"
        placeholder="Wat viel je op? Wat mis je? Wat werkte niet zoals je verwachtte?"
      ></textarea>

      <div class="form-foot">
        <!-- De reactie gaat anoniem naar PostHog; zonder deze regel vullen
             mensen alsnog hun naam of mailadres in het tekstvak. -->
        <p class="hint">Je bericht komt binnen zonder je naam. Vul hier geen persoonlijke gegevens in.</p>
        <div class="form-actions">
          <button type="button" class="btn ghost" @click="cancel">Annuleren</button>
          <button type="submit" class="btn primary" :disabled="!canSend">Versturen</button>
        </div>
      </div>
    </form>

    <p v-else class="thanks">
      <span class="mdi mdi-check-circle-outline" aria-hidden="true"></span>
      Dank je wel — je bericht is binnen.
    </p>
  </div>
</template>

<script>
import { captureFeedback } from '../utils/analytics'

export default {
  name: 'FeedbackForm',
  props: {
    // Waar de leerling stond toen hij dit schreef; nooit iets persoonlijks.
    context: {
      type: Object,
      default: () => ({}),
    },
    rows: {
      type: Number,
      default: 4,
    },
    autofocus: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['sent', 'cancel'],
  data() {
    return {
      // 'open' | 'sent'
      state: 'open',
      message: '',
    }
  },
  computed: {
    canSend() {
      return this.message.trim().length > 0
    },
  },
  mounted() {
    if (this.autofocus) {
      this.$nextTick(() => {
        if (this.$refs.input) {
          this.$refs.input.focus()
        }
      })
    }
  },
  methods: {
    cancel() {
      this.message = ''
      this.$emit('cancel')
    },
    submit() {
      if (!this.canSend) {
        return
      }
      captureFeedback(this.message.trim(), this.context)
      this.message = ''
      this.state = 'sent'
      this.$emit('sent')
    },
  },
}
</script>

<style scoped>
.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.hint {
  margin: 0;
  flex: 1;
  min-width: 200px;
  font-size: 12px;
  color: var(--faint);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--border);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn.ghost {
  background: var(--surface);
  color: var(--muted);
}

.btn.ghost:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.btn.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.thanks {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent);
}

.thanks .mdi {
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 760px) {
  .form-actions {
    width: 100%;
  }

  .form-actions .btn {
    flex: 1;
  }
}
</style>
