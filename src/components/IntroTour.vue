<template>
  <div class="backdrop" @click.self="onBackdrop">
    <div class="tour" role="dialog" aria-modal="true" :aria-label="step.title">
      <button v-if="dismissible" class="close" aria-label="Sluiten" @click="close">
        <span class="mdi mdi-close" aria-hidden="true"></span>
      </button>

      <!-- Placeholder-afbeeldingen staan in public/intro en zijn te vervangen
           door echte schermafbeeldingen met dezelfde bestandsnaam. -->
      <div class="shot">
        <img :src="step.image" :alt="step.title" />
      </div>

      <div class="body">
        <div class="step-count pp-mono">Stap {{ index + 1 }} van {{ steps.length }}</div>
        <h2 class="title">{{ step.title }}</h2>
        <p class="text">{{ step.text }}</p>

        <label v-if="isLast" class="hide-line">
          <input v-model="hideNextTime" type="checkbox" />
          <span>Deze uitleg niet meer tonen</span>
        </label>
      </div>

      <div class="foot">
        <div class="dots" aria-hidden="true">
          <span
            v-for="(item, dotIndex) in steps"
            :key="item.title"
            class="dot"
            :class="{ active: dotIndex === index }"
            @click="index = dotIndex"
          ></span>
        </div>

        <div class="actions">
          <button v-if="index > 0" class="btn ghost" @click="index -= 1">Vorige</button>
          <button class="btn primary" @click="next">
            <span>{{ isLast ? 'Sluiten' : 'Ga verder' }}</span>
            <span v-if="!isLast" class="mdi mdi-arrow-right" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export const INTRO_HIDDEN_KEY = 'plannerIntroHidden'

export function introHidden() {
  try {
    return localStorage.getItem(INTRO_HIDDEN_KEY) === 'true'
  } catch {
    return false
  }
}

const STEPS = [
  {
    title: 'Welkom bij PeriodePlanner',
    text: 'Stel eenmalig je leerjaar en je vakken in. Daarna opent de planner altijd op jouw eigen link, met alleen de vakken die jij volgt.',
    image: '/intro/stap-1.png',
  },
  {
    title: 'Lijstweergave: het hele jaar',
    text: 'Blader door alle weken van het jaar. Klap een week open en je ziet links de toetsen en planning per vak, rechts de dagen van die week met de schoolbrede activiteiten.',
    image: '/intro/stap-2.png',
  },
  {
    title: 'Maandweergave: alles in beeld',
    text: 'Een hele maand in één oogopslag, zonder open- en dichtklappen. Links de vakken per week, rechts maandag tot en met zondag onder elkaar.',
    image: '/intro/stap-3.png',
  },
  {
    title: 'Per vak: één vak volgen',
    text: 'Kies één vak en zie alles van dat vak onder elkaar, met alle toelichting erbij. Weken zonder items blijven als streepje staan, zodat je ziet dat ze bestaan.',
    image: '/intro/stap-4.png',
  },
  {
    title: 'Filteren, exporteren en delen',
    text: 'Filter op toetsen, planning of schoolbrede activiteiten. Exporteer je planning naar A4 of pdf, en deel je eigen link — of zet de planner op het beginscherm van je telefoon.',
    image: '/intro/stap-5.png',
  },
]

export default {
  name: 'IntroTour',
  props: {
    // Bij de eerste keer staat dit uit: dan loop je de uitleg helemaal door en
    // sluit je hem met de knop op de laatste stap.
    dismissible: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      index: 0,
      hideNextTime: false,
      steps: STEPS,
    }
  },
  computed: {
    step() {
      return this.steps[this.index]
    },
    isLast() {
      return this.index === this.steps.length - 1
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    next() {
      if (this.isLast) {
        this.close()
        return
      }
      this.index += 1
    },
    close() {
      // Alleen bewust aanvinken onthoudt de keuze; anders komt de uitleg terug.
      if (this.hideNextTime) {
        try {
          localStorage.setItem(INTRO_HIDDEN_KEY, 'true')
        } catch {
          // opslag niet beschikbaar
        }
      }
      this.$emit('close')
    },
    onBackdrop() {
      if (this.dismissible) {
        this.close()
      }
    },
    onKeydown(event) {
      if (event.key === 'Escape' && this.dismissible) {
        this.close()
      }
      if (event.key === 'ArrowRight' && !this.isLast) {
        this.index += 1
      }
      if (event.key === 'ArrowLeft' && this.index > 0) {
        this.index -= 1
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
  /* 50px boven en onder; de hoogte hieronder rekent daarmee. */
  padding: 50px 20px;
}

.tour {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 1200px;
  max-width: 100%;
  max-height: min(calc(100vh - 100px), 1200px);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  animation: pp-pop 0.18s ease both;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
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

/* Krimpt mee als het scherm laag is; de afbeelding blijft altijd volledig in
   beeld en krijgt witte balken waar ze niet past. */
.shot {
  flex: 1 1 auto;
  min-height: 120px;
  aspect-ratio: 16 / 9;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.shot img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.body {
  flex: 0 0 auto;
  overflow-y: auto;
  padding: 18px 20px 4px;
}

.step-count {
  font-size: 11.5px;
  color: var(--faint);
  margin-bottom: 6px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}

.text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--muted);
}

.hide-line {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 16px;
  font-size: 13.5px;
  color: var(--text);
  cursor: pointer;
}

.hide-line input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 18px 20px 20px;
}

.dots {
  display: flex;
  gap: 7px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--border-strong);
  cursor: pointer;
  transition: background 0.12s, width 0.12s;
}

.dot.active {
  width: 22px;
  background: var(--accent);
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.btn.primary .mdi {
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 600px) {
  .backdrop {
    padding: 0;
    align-items: stretch;
  }

  .tour {
    width: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
    border: none;
  }

  .actions {
    width: 100%;
  }

  .btn.primary {
    flex: 1;
    justify-content: center;
  }
}
</style>
