<template>
  <section class="feedback">
    <div class="lead">
      <span class="mdi mdi-message-text-outline" aria-hidden="true"></span>
      <p class="lead-text">Zie je iets wat anders of beter kan? Laat het ons weten!</p>
      <button v-if="!formOpen" class="open-btn" @click="formOpen = true">
        {{ sentOnce ? 'Nog iets kwijt?' : 'Geef feedback' }}
      </button>
    </div>

    <FeedbackForm
      v-if="formOpen"
      :key="round"
      class="form-slot"
      :context="context"
      @sent="onSent"
      @cancel="formOpen = false"
    />
  </section>
</template>

<script>
import FeedbackForm from './FeedbackForm.vue'

export default {
  name: 'FeedbackBox',
  components: {
    FeedbackForm,
  },
  props: {
    context: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      formOpen: false,
      sentOnce: false,
      // Een nieuwe key geeft een schoon formulier bij een tweede bericht.
      round: 0,
    }
  },
  methods: {
    onSent() {
      this.sentOnce = true
      // Het bedankje blijft staan; pas als iemand opnieuw klikt komt er een
      // leeg tekstvak terug.
      setTimeout(() => {
        this.formOpen = false
        this.round += 1
      }, 2600)
    },
  },
}
</script>

<style scoped>
.feedback {
  margin-top: 40px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.lead {
  display: flex;
  align-items: center;
  gap: 11px;
  flex-wrap: wrap;
}

.lead .mdi {
  font-size: 20px;
  line-height: 1;
  color: var(--accent);
}

.lead-text {
  margin: 0;
  flex: 1;
  min-width: 200px;
  font-size: 14px;
  color: var(--text);
}

.open-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--accent-border);
  background: var(--accent-soft);
  color: var(--accent);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.open-btn:hover {
  border-color: var(--accent);
}

.form-slot {
  display: block;
  margin-top: 14px;
}

@media (max-width: 760px) {
  .feedback {
    margin-top: 28px;
  }
}
</style>
