<template>
  <div class="day-rows">
    <div
      v-for="day in days"
      :key="day.key"
      class="day-row"
      :class="{ out: !day.inMonth, weekend: day.isWeekend, today: day.isToday }"
    >
      <div class="day-stamp">
        <span class="day-name pp-mono">{{ day.weekday }}</span>
        <span class="num" :class="{ today: day.isToday }">{{ day.num }}</span>
      </div>
      <div class="day-chips">
        <div
          v-for="(chip, chipIndex) in day.chips"
          :key="chipIndex"
          class="chip"
          :class="{ holiday: chip.holiday }"
          :title="chip.event.label"
          @click="$emit('open', chip.event)"
        >
          {{ chip.event.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// De dagkolom van maandag t/m zondag. Zowel de lijst- als de maandweergave
// gebruiken deze, zodat een dag er in beide precies hetzelfde uitziet.
export default {
  name: 'DayRows',
  props: {
    days: {
      type: Array,
      required: true,
    },
  },
  emits: ['open'],
}
</script>

<style scoped>
.day-rows {
  display: flex;
  flex-direction: column;
}

.day-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 0;
  min-height: 30px;
  padding: 3px 10px;
  border-bottom: 1px solid var(--border);
  min-width: 0;
}

.day-row:last-child {
  border-bottom: none;
}

.day-row.weekend {
  background: var(--surface-2);
}

.day-row.out {
  opacity: 0.5;
}

.day-row.today {
  background: var(--accent-soft);
}

.day-stamp {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 46px;
  flex-shrink: 0;
}

.day-name {
  font-size: 10.5px;
  text-transform: uppercase;
  color: var(--faint);
}

.num {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text);
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.day-row.out .num {
  color: var(--faint);
}

.num.today {
  font-weight: 700;
  color: var(--on-accent);
  background: var(--accent);
}

.day-chips {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

/* Past een naam niet, dan kapt hij af met "…"; de titel toont hem volledig. */
.chip {
  font-size: 11px;
  line-height: 1.35;
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.day-row.weekend .chip {
  background: var(--surface);
}

.chip:hover {
  border-color: var(--accent-border);
  color: var(--accent);
}

.chip.holiday {
  background: var(--accent-soft);
  border-color: var(--accent-border);
}
</style>
