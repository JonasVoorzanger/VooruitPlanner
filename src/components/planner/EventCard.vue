<template>
  <div class="event-card" :class="{ dense: isDense }" @click="openGroup">
    <div class="card-head">
      <span class="abbr pp-mono" :title="subjectName">{{ group.abbr }}</span>
    </div>
    <div class="items">
      <div v-if="planItems.length" class="item-section plan-section">
        <div v-for="(item, index) in planItems" :key="`plan-${index}`" class="item">
          <div class="item-line">
            <span v-if="modeFlags.title" class="item-title">{{ item.event.label || item.meta.label }}</span>
          </div>
          <MarkdownContent
            v-if="modeFlags.desc && item.event.description"
            class="item-desc"
            :content="item.event.description"
          />
        </div>
      </div>

      <div v-if="planItems.length && testItems.length" class="section-divider" aria-hidden="true"></div>

      <div v-if="testItems.length" class="item-section test-section">
        <div v-for="(item, index) in testItems" :key="`test-${index}`" class="item">
          <div class="item-line">
            <span class="type-badge pp-mono">{{ item.meta.label }}</span>
            <span v-if="modeFlags.title" class="item-title">{{ item.event.label || item.meta.label }}</span>
            <span v-if="modeFlags.weight && item.weightLabel" class="weight pp-mono">
              {{ item.weightLabel }}
            </span>
          </div>
          <MarkdownContent
            v-if="modeFlags.desc && item.event.description"
            class="item-desc"
            :content="item.event.description"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MarkdownContent from '../MarkdownContent.vue'
import { typeMeta, weightLabel } from '../../utils/plannerModel'

const MODE_FLAGS = {
  listFull: { title: true, weight: true, desc: true, dense: false, testsOnly: false },
  listCompact: { title: true, weight: false, desc: false, dense: false, testsOnly: false },
  monthFull: { title: true, weight: true, desc: false, dense: true, testsOnly: false },
  monthCompact: { title: false, weight: false, desc: false, dense: true, testsOnly: true },
}

export default {
  name: 'EventCard',
  components: {
    MarkdownContent,
  },
  props: {
    group: {
      type: Object,
      required: true,
    },
    mode: {
      type: String,
      default: 'listFull',
    },
    subjectsMap: {
      type: Object,
      default: () => ({}),
    },
    whenLabel: {
      type: String,
      default: '',
    },
  },
  emits: ['open'],
  computed: {
    modeFlags() {
      return MODE_FLAGS[this.mode] || MODE_FLAGS.listFull
    },
    isDense() {
      return this.modeFlags.dense
    },
    subjectName() {
      return this.subjectsMap[this.group.abbr] || ''
    },
    visibleItems() {
      const events = this.modeFlags.testsOnly
        ? this.group.events.filter((event) => typeMeta(event.type).test)
        : this.group.events

      return events.map((event) => ({
        event,
        meta: typeMeta(event.type),
        weightLabel: weightLabel(event.weight),
      }))
    },
    planItems() {
      return this.visibleItems.filter((item) => !item.meta.test)
    },
    testItems() {
      return this.visibleItems.filter((item) => item.meta.test)
    },
  },
  methods: {
    openGroup() {
      this.$emit('open', { events: this.group.events, whenLabel: this.whenLabel })
    },
  },
}
</script>

<style scoped>
.event-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  transition: border-color 0.12s, box-shadow 0.12s;
  cursor: pointer;
}

.event-card:hover {
  border-color: var(--accent-border);
  box-shadow: var(--shadow);
}

.event-card.dense {
  border-radius: 8px;
  padding: 6px 8px;
  gap: 4px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.abbr {
  font-weight: 600;
  font-size: 11px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 5px;
  padding: 1px 6px;
  cursor: help;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.item-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.section-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}

.test-section {
  border-left: 4px solid var(--accent);
  padding-left: 8px;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item:hover {
  opacity: 0.66;
}

.item-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.type-badge {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
}

.item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  text-wrap: pretty;
}

.weight {
  font-size: 10px;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 0 5px;
  white-space: nowrap;
}

.item-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
  text-wrap: pretty;
}

.item-desc :deep(p) {
  margin: 0;
}
</style>
