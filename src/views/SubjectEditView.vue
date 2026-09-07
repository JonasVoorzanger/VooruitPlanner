<template>
  <v-container class="py-6">
    <div class="page-shell d-flex flex-column ga-5">
      <div>
        <h1 class="text-h5 font-weight-bold">{{ courseName }} · klas {{ year }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Bewerk de items van dit vak en download het resultaat als CSV.
        </p>
      </div>

      <v-alert type="info" variant="tonal" density="comfortable">
        Wijzigingen worden <strong>niet</strong> online opgeslagen. Nadat je wijzigingen hebt doorgevoerd, druk je op "Download CSV" en mail je het bestand naar de beheerder van de planner.
      </v-alert>

      <v-card rounded="xl">
        <v-card-text class="d-flex flex-wrap align-center ga-4">
          <div class="pp-stat">
            <div class="text-h6 font-weight-bold">{{ rows.length }}</div>
            <div class="text-caption text-medium-emphasis">items</div>
          </div>
          <div class="pp-stat">
            <div class="text-h6 font-weight-bold">{{ testCount }}</div>
            <div class="text-caption text-medium-emphasis">toetsen</div>
          </div>
          <div class="pp-stat">
            <div class="text-h6 font-weight-bold">{{ filledWeekCount }}</div>
            <div class="text-caption text-medium-emphasis">weken met items</div>
          </div>

          <v-spacer />

          <v-chip v-if="dirty" color="warning" variant="tonal" prepend-icon="mdi-pencil-outline">
            Niet-gedownloade wijzigingen
          </v-chip>
          <v-btn color="primary" prepend-icon="mdi-download-outline" @click="downloadFile">
            Download CSV
          </v-btn>
        </v-card-text>
      </v-card>

      <v-card v-if="orphanRows.length" rounded="xl" color="warning" variant="tonal">
        <v-card-title class="text-subtitle-1">Items buiten de bekende weken</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            Deze items verwijzen naar een week die niet in het <code>weeks</code>-tabblad staat. Ze blijven in de CSV
            staan, maar verschijnen niet in de planner.
          </p>
          <ItemEditor
            v-for="row in orphanRows"
            :key="row.id"
            :row="row"
            :type-options="typeOptions"
            show-week
            @remove="removeRow(row)"
          />
        </v-card-text>
      </v-card>

      <v-card v-for="week in weekRows" :key="week.key" rounded="xl" elevation="0" border>
        <v-card-title class="week-head d-flex flex-wrap align-center ga-3 text-subtitle-1">
          <span>{{ week.label }}</span>
          <span class="text-caption text-medium-emphasis pp-mono">{{ week.range }}</span>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">
            {{ week.items.length }} {{ week.items.length === 1 ? 'item' : 'items' }}
          </span>
        </v-card-title>

        <v-card-text class="week-body">
          <!-- Slepen verplaatst een item binnen de week of naar een andere week. -->
          <div
            class="week-items"
            :class="{ 'drop-into': dropWeekKey === week.key && !week.items.length }"
            @dragover.prevent="onDragOverWeek(week)"
            @drop.prevent="onDropOnWeek(week)"
          >
            <div
              v-for="row in week.items"
              :key="row.id"
              class="item-card"
              :class="{
                dragging: draggingId === row.id,
                'drop-above': dropMarker.id === row.id && dropMarker.position === 'before',
                'drop-below': dropMarker.id === row.id && dropMarker.position === 'after',
              }"
              :draggable="handleId === row.id"
              @dragstart="onDragStart(row, $event)"
              @dragend="onDragEnd"
              @dragover.prevent.stop="onDragOverItem(row, $event)"
              @drop.prevent.stop="onDropOnItem(row, week)"
            >
              <button
                class="drag-handle"
                title="Sleep om de volgorde te wijzigen"
                @mousedown="handleId = row.id"
                @mouseup="handleId = null"
              >
                <v-icon size="20">mdi-drag</v-icon>
              </button>

              <ItemEditor
                class="item-body"
                :row="row"
                :type-options="typeOptions"
                @remove="removeRow(row)"
              />
            </div>

            <p v-if="!week.items.length" class="empty-week text-body-2 text-medium-emphasis">
              Geen items. Sleep er een naartoe of voeg er een toe.
            </p>
          </div>

          <v-btn
            variant="tonal"
            size="small"
            prepend-icon="mdi-plus"
            class="mt-3"
            @click="addRow(week)"
          >
            Item toevoegen
          </v-btn>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import ItemEditor from '../components/admin/ItemEditor.vue'
import { useSpreadsheetStore } from '../stores/spreadsheet'
import { EVENT_COLUMNS, downloadCsv, toCsv } from '../utils/csv'
import { formatWeekRange, isTestEvent, parseDate, typeMeta } from '../utils/plannerModel'

const TYPE_VALUES = ['plan', 'proefwerk', 'so', 'schoolexamen', 'presentatie', 'luistertoets']

let nextId = 1

export default {
  name: 'SubjectEditView',
  components: {
    ItemEditor,
  },
  data() {
    return {
      spreadsheetStore: useSpreadsheetStore(),
      rows: [],
      dirty: false,
      // Slepen: handleId zet draggable pas aan bij de greep, zodat de velden
      // gewoon te selecteren blijven.
      handleId: null,
      draggingId: null,
      dropMarker: { id: null, position: '' },
      dropWeekKey: '',
      typeOptions: TYPE_VALUES.map((value) => ({ value, title: typeMeta(value).label })),
    }
  },
  computed: {
    year() {
      return Number(this.$route.params.year)
    },
    course() {
      return String(this.$route.params.course || '').toUpperCase()
    },
    courseName() {
      const subject = this.spreadsheetStore.subjects.find((item) => item.abbreviation === this.course)
      return subject ? `${subject.abbreviation} · ${subject.full_name}` : this.course
    },
    weeks() {
      return [...this.spreadsheetStore.weeks].sort((a, b) => {
        const startA = parseDate(a.start_date)
        const startB = parseDate(b.start_date)
        return (startA ? startA.getTime() : 0) - (startB ? startB.getTime() : 0)
      })
    },
    // Elke week uit de spreadsheet, met de items die eraan hangen.
    weekRows() {
      return this.weeks.map((week) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)
        const calYear = start ? start.getFullYear() : null

        return {
          key: `${week.start_date}-${week.week_number}`,
          label: week.label || `Week ${week.week_number}`,
          range: start && end ? `${formatWeekRange(start, end)} (wk ${week.week_number})` : '',
          calYear,
          calWeekNumber: Number(week.week_number),
          items: this.rows.filter(
            (row) =>
              Number(row.cal_week_number) === Number(week.week_number) &&
              Number(row.cal_year) === Number(calYear),
          ),
        }
      })
    },
    // Items die naar een onbekende week verwijzen; die mogen niet stilletjes
    // verdwijnen uit de export.
    orphanRows() {
      const known = new Set(this.weekRows.map((week) => `${week.calYear}-${week.calWeekNumber}`))
      return this.rows.filter((row) => !known.has(`${Number(row.cal_year)}-${Number(row.cal_week_number)}`))
    },
    testCount() {
      return this.rows.filter((row) => isTestEvent(row)).length
    },
    filledWeekCount() {
      return this.weekRows.filter((week) => week.items.length > 0).length
    },
  },
  watch: {
    rows: {
      handler() {
        this.dirty = true
      },
      deep: true,
    },
    '$route.params': {
      handler() {
        this.loadRows()
      },
      deep: true,
    },
  },
  created() {
    this.loadRows()
  },
  mounted() {
    window.addEventListener('beforeunload', this.onBeforeUnload)
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
  },
  beforeRouteLeave(to, from, next) {
    next(this.confirmLeave())
  },
  methods: {
    loadRows() {
      this.rows = this.spreadsheetStore.events
        .filter(
          (event) =>
            event.subject_abbreviation === this.course &&
            Number(event.year) === this.year &&
            String(event.type || '').trim().toLowerCase() !== 'school-wide',
        )
        .map((event) => ({
          id: nextId++,
          cal_year: event.cal_year ?? '',
          cal_week_number: event.cal_week_number ?? '',
          type: event.type || 'plan',
          weight: event.weight || '',
          label: event.label || '',
          description: event.description || '',
        }))
      this.$nextTick(() => {
        this.dirty = false
      })
    },
    addRow(week) {
      this.rows.push({
        id: nextId++,
        cal_year: week.calYear,
        cal_week_number: week.calWeekNumber,
        type: 'plan',
        weight: '',
        label: '',
        description: '',
      })
    },
    removeRow(row) {
      this.rows = this.rows.filter((item) => item.id !== row.id)
    },
    onDragStart(row, event) {
      this.draggingId = row.id
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        // Firefox start pas een sleepactie als er data gezet is.
        event.dataTransfer.setData('text/plain', String(row.id))
      }
    },
    onDragEnd() {
      this.draggingId = null
      this.handleId = null
      this.dropMarker = { id: null, position: '' }
      this.dropWeekKey = ''
    },
    onDragOverItem(row, event) {
      if (this.draggingId === null || this.draggingId === row.id) {
        return
      }
      const box = event.currentTarget.getBoundingClientRect()
      const position = event.clientY < box.top + box.height / 2 ? 'before' : 'after'
      this.dropMarker = { id: row.id, position }
      this.dropWeekKey = ''
    },
    onDragOverWeek(week) {
      if (this.draggingId === null) {
        return
      }
      this.dropWeekKey = week.key
    },
    onDropOnItem(row, week) {
      if (this.draggingId === null || this.draggingId === row.id) {
        this.onDragEnd()
        return
      }
      this.moveRow(this.draggingId, week, { beforeId: row.id, position: this.dropMarker.position })
      this.onDragEnd()
    },
    onDropOnWeek(week) {
      if (this.draggingId === null) {
        return
      }
      this.moveRow(this.draggingId, week, {})
      this.onDragEnd()
    },
    // Verplaatst een item naar een week en zet het op de juiste plek. Alleen de
    // volgorde binnen een week telt; de CSV loopt per week.
    moveRow(id, week, { beforeId, position }) {
      const rows = [...this.rows]
      const fromIndex = rows.findIndex((item) => item.id === id)
      if (fromIndex === -1) {
        return
      }

      const [moved] = rows.splice(fromIndex, 1)
      moved.cal_year = week.calYear
      moved.cal_week_number = week.calWeekNumber

      let insertAt
      if (beforeId != null) {
        const targetIndex = rows.findIndex((item) => item.id === beforeId)
        insertAt = targetIndex === -1 ? rows.length : targetIndex + (position === 'after' ? 1 : 0)
      } else {
        // Achter het laatste item van deze week; is de week leeg, dan maakt de
        // plek in de lijst niet uit.
        let lastIndex = -1
        rows.forEach((item, index) => {
          if (
            Number(item.cal_week_number) === Number(week.calWeekNumber) &&
            Number(item.cal_year) === Number(week.calYear)
          ) {
            lastIndex = index
          }
        })
        insertAt = lastIndex + 1
      }

      rows.splice(insertAt, 0, moved)
      this.rows = rows
    },
    // De rijen in weekvolgorde, zodat de CSV leesbaar blijft.
    orderedRows() {
      const ordered = []
      this.weekRows.forEach((week) => ordered.push(...week.items))
      ordered.push(...this.orphanRows)
      return ordered
    },
    csvText() {
      return toCsv(
        EVENT_COLUMNS,
        this.orderedRows().map((row) => ({
          cal_year: row.cal_year,
          cal_week_number: row.cal_week_number,
          subject_abbreviation: this.course,
          year: this.year,
          type: row.type,
          weight: row.weight,
          label: row.label,
          description: row.description,
          date: '',
          end_date: '',
          year_1: '',
          year_2: '',
          year_3: '',
          year_4: '',
          year_5: '',
          year_6: '',
        })),
      )
    },
    downloadFile() {
      downloadCsv(`events-${this.course}-klas${this.year}.csv`, this.csvText())
      this.dirty = false
    },
    confirmLeave() {
      if (!this.dirty) {
        return true
      }
      return window.confirm('Je wijzigingen zijn nog niet gedownload. Weet je zeker dat je weggaat?')
    },
    onBeforeUnload(event) {
      if (this.dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    },
  },
}
</script>

<style scoped>
.pp-stat {
  min-width: 88px;
}

.week-head {
  background: rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.09);
}

/* Lichtgrijze ondergrond, zodat de witte itemkaarten ervan loskomen. */
.week-body {
  background: rgba(0, 0, 0, 0.032);
  padding-top: 18px;
  padding-bottom: 18px;
}

.week-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 10px;
}

.week-items.drop-into {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: 4px;
}

.item-card {
  --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 3px 8px rgba(0, 0, 0, 0.09);
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 16px 12px 12px;
  margin: 2px 1px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--card-shadow);
}

.item-card.dragging {
  opacity: 0.4;
}

.item-card.drop-above {
  box-shadow: inset 0 3px 0 0 rgb(var(--v-theme-primary)), var(--card-shadow);
}

.item-card.drop-below {
  box-shadow: inset 0 -3px 0 0 rgb(var(--v-theme-primary)), var(--card-shadow);
}

.item-body {
  flex: 1;
  min-width: 0;
}

.drag-handle {
  flex: 0 0 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(0, 0, 0, 0.35);
  cursor: grab;
  border-radius: 6px;
}

.drag-handle:hover {
  color: rgba(0, 0, 0, 0.7);
  background: rgba(0, 0, 0, 0.05);
}

.drag-handle:active {
  cursor: grabbing;
}

.empty-week {
  margin: 0;
  padding: 10px 2px;
}
</style>
