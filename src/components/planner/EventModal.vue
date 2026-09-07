<template>
  <div class="backdrop" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div class="modal-title">{{ headerTitle }}</div>
        <button class="close" @click="close">✕</button>
      </div>
      <div class="modal-body" :class="{ multi: details.length > 1 }">
        <div v-for="(detail, index) in details" :key="index" class="detail-item">
          <div class="badges">
            <span v-if="detail.subjectAbbreviation" class="subject-abbr pp-mono">{{ detail.subjectAbbreviation }}</span>
            <span v-if="detail.subjectName" class="subject-name">{{ detail.subjectName }}</span>
            <span class="type-badge pp-mono" :class="{ test: detail.isTest }">{{ detail.typeLabel }}</span>
            <span v-if="detail.weightLabel" class="weight pp-mono">{{ detail.weightLabel }}</span>
          </div>
          <div class="title">{{ detail.title }}</div>

          <MarkdownContent v-if="detail.description" class="description" :content="detail.description" />
          <div v-else class="no-description">Geen extra toelichting.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MarkdownContent from '../MarkdownContent.vue'

export default {
  name: 'EventModal',
  components: {
    MarkdownContent,
  },
  props: {
    details: {
      type: Array,
      required: true,
    },
  },
  emits: ['close'],
  computed: {
    headerTitle() {
      if (this.details.length <= 1) {
        return 'Details'
      }
      return `${this.details.length} activiteiten`
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    close() {
      this.$emit('close')
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
  background: rgba(20, 22, 40, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal {
  width: 100%;
  max-width: 440px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: pp-pop 0.18s ease both;
}

.modal-head {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.subject-abbr {
  font-weight: 600;
  font-size: 10.5px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 5px;
  padding: 1px 7px;
}

.subject-name {
  font-size: 12.5px;
  color: var(--muted);
}

.type-badge {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.type-badge.test {
  color: var(--accent);
}

.weight {
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1px 7px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
}

.close:hover {
  color: var(--text);
}

.modal-body {
  padding: 18px 20px;
}

.modal-body.multi {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-item + .detail-item {
  border-top: 1px solid var(--border);
  padding-top: 14px;
}

.description {
  font-size: 14px;
  line-height: 1.55;
  color: var(--text);
  text-wrap: pretty;
}

.no-description {
  font-size: 13.5px;
  color: var(--faint);
}
</style>
