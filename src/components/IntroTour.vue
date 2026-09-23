<template>
  <div class="backdrop" @click.self="onBackdrop">
    <div class="tour" role="dialog" aria-modal="true" :aria-label="step.title">
      <button v-if="dismissible" class="close" aria-label="Sluiten" @click="close">
        <span class="mdi mdi-close" aria-hidden="true"></span>
      </button>

      <!-- De afbeeldingen staan in public/intro. Op mobiel tonen we de
           -mobile-variant: een uitsnede van het telefoonscherm, want de
           volledige schermafbeelding is daar te klein om iets aan af te lezen. -->
      <div v-if="stepImage" class="shot">
        <img :src="stepImage" :alt="step.title" />
      </div>

      <div class="head">
        <div class="step-count pp-mono">Stap {{ index + 1 }} van {{ steps.length }}</div>
        <h2 class="title">{{ stepTitle }}</h2>
      </div>

      <div class="body">
        <p v-if="stepText" class="text">{{ stepText }}</p>

        <div v-if="isLast" class="closing">
          <p class="disclaimer">
            Zie je in week 6 een storm aankomen met drie toetsen tegelijk? Dan kun je het zonnetje
            in week 4 gebruiken om vooruit te werken. De planner is je meerdaagse verwachting; wat
            je docent in de les vertelt, is de buienradar. En de buienradar heeft altijd het laatste
            woord. ⛈️
          </p>

          <label class="check-line accept">
            <input v-model="disclaimerAccepted" type="checkbox" />
            <span>Ik begrijp dat de planner een verwachting is en dat ik er geen rechten aan kan ontlenen</span>
          </label>

          <label class="check-line">
            <input v-model="hideNextTime" type="checkbox" />
            <span>Deze uitleg niet meer tonen</span>
          </label>
        </div>
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
          <button class="btn primary" :disabled="!canClose" :title="closeHint" @click="next">
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
export const DISCLAIMER_KEY = 'plannerDisclaimerAccepted'

export function introHidden() {
  try {
    return localStorage.getItem(INTRO_HIDDEN_KEY) === 'true'
  } catch {
    return false
  }
}

// Zelfde grens als de media query onderaan dit bestand.
const MOBILE_QUERY = '(max-width: 600px)'

const STEPS = [
  {
    title: 'Welkom bij de VooruitPlanner',
    text: 'Stel eenmalig je leerjaar en je vakken in. Daarna opent de planner altijd op jouw eigen link, met alleen de vakken die jij volgt.',
    image: '/intro/stap-1.png',
    mobileImage: '/intro/stap-1-mobile.png',
  },
  {
    title: 'Drie weergaven, dezelfde planning',
    text: 'Wissel bovenin tussen Lijst, Maand en Per vak. Lijst loopt week voor week door het jaar, Maand zet een hele maand in beeld en Per vak zet één vak onder elkaar. Je kijkt steeds naar dezelfde planning, alleen anders gerangschikt.',
    // De maandweergave heeft een breed scherm nodig, dus op mobiel zijn het er
    // twee en klopt het woord "bovenin" ook niet meer.
    mobileTitle: 'Twee weergaven, dezelfde planning',
    mobileText: 'Wissel in het menu tussen Lijst en Per vak. Lijst loopt week voor week door het jaar en Per vak zet één vak onder elkaar. De maandweergave heeft een breed scherm nodig; die zie je alleen op een laptop.',
    image: '/intro/stap-2.png',
    mobileImage: '/intro/stap-2-mobile.png',
  },
  {
    title: 'Filter op wat je zoeken wilt',
    text: 'Met Filter kies je welke soorten items je ziet: Toetsen, Planning of Overig — dat laatste zijn de schoolbrede activiteiten en de vakanties. Staat er een filter aan, dan zie je dat aan de teller naast de knop.',
    mobileText: 'Onder Menu kies je met Filter welke soorten items je ziet: Toetsen, Planning of Overig — dat laatste zijn de schoolbrede activiteiten en de vakanties. Staat er een filter aan, dan zie je dat aan de knop.',
    image: '/intro/stap-3.png',
    mobileImage: '/intro/stap-3-mobile.png',
  },
  {
    title: 'Op papier of als pdf',
    text: 'Met Exporteren maak je een nette A4 van je planning. Je kiest zelf de weergave, het vak, het detailniveau en welke weken meegaan — bijvoorbeeld alleen de weken met toetsen. Kies in het printvenster “Opslaan als pdf” voor een digitaal bestand.',
    image: '/intro/stap-4.png',
    mobileImage: '/intro/stap-4-mobile.png',
  },
  {
    // Geen afbeelding: hier gaat het om het vinkje, niet om een schermbeeld.
    title: 'De planner is een verwachting',
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
      disclaimerAccepted: false,
      steps: STEPS,
      isMobile: false,
      mediaQuery: null,
    }
  },
  computed: {
    step() {
      return this.steps[this.index]
    },
    // Op een telefoon staat de knop ergens anders en is de maandweergave er
    // niet, dus sommige stappen hebben daar hun eigen woorden.
    stepTitle() {
      return (this.isMobile && this.step.mobileTitle) || this.step.title
    },
    stepText() {
      return (this.isMobile && this.step.mobileText) || this.step.text
    },
    stepImage() {
      return this.isMobile ? this.step.mobileImage : this.step.image
    },
    isLast() {
      return this.index === this.steps.length - 1
    },
    // Op de laatste stap kom je alleen langs het voorbehoud heen door het aan
    // te vinken; de kruisjes en Escape blijven wel gewoon werken.
    canClose() {
      return !this.isLast || this.disclaimerAccepted
    },
    closeHint() {
      return this.canClose ? '' : 'Vink eerst aan dat je het voorbehoud begrepen hebt'
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
    try {
      this.disclaimerAccepted = localStorage.getItem(DISCLAIMER_KEY) === 'true'
    } catch {
      // opslag niet beschikbaar
    }
    this.mediaQuery = window.matchMedia(MOBILE_QUERY)
    this.isMobile = this.mediaQuery.matches
    this.mediaQuery.addEventListener('change', this.onMediaChange)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.onMediaChange)
    }
  },
  methods: {
    onMediaChange(event) {
      this.isMobile = event.matches
    },
    next() {
      if (this.isLast) {
        if (this.canClose) {
          this.close()
        }
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
      // Zo staat het vinkje de volgende keer al goed en hoeft niemand hetzelfde
      // voorbehoud twee keer te bevestigen.
      if (this.disclaimerAccepted) {
        try {
          localStorage.setItem(DISCLAIMER_KEY, 'true')
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
  width: 560px;
  max-width: 100%;
  /* Vast, zodat de knoppen onderin niet per stap verspringen. */
  height: min(700px, calc(100vh - 100px));
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

/* De uitsneden zijn klein en hebben elk een eigen verhouding, dus het kader
   houdt de afbeelding op ware grootte binnen een vak van zo'n 400 bij 400 in
   plaats van haar over de volle breedte uit te rekken. */
.shot {
  flex: 0 0 auto;
  /* Even hoog bij elke stap; smalle uitsneden houden ruimte boven en onder. */
  height: min(444px, 46vh);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 20px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.shot img {
  display: block;
  width: auto;
  height: auto;
  max-width: min(400px, 100%);
  max-height: 100%;
  object-fit: contain;
  /* Een randje maakt van een losse uitsnede weer een stukje scherm. */
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
}

.head {
  flex: 0 0 auto;
  padding: 18px 20px 0;
}

.body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 8px 20px 4px;
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
  margin: 0;
}

.text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--muted);
}

.closing {
  margin-top: 16px;
}

.closing:first-child {
  margin-top: 4px;
}

.disclaimer {
  margin: 0 0 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  background: var(--surface-2);
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text);
}

.check-line {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--text);
  cursor: pointer;
}

.check-line.accept {
  font-weight: 600;
}

.check-line input {
  width: 16px;
  height: 16px;
  /* Zet het vakje op de eerste regel tekst als die afbreekt. */
  margin-top: 1px;
  flex-shrink: 0;
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

.btn.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
    height: auto;
    border-radius: 0;
    border: none;
  }

  .shot {
    height: auto;
    padding: 14px;
  }

  /* Het vak heeft hier geen vaste hoogte, dus de grens moet op de afbeelding
     zelf staan: anders zou het kader haar bijsnijden in plaats van schalen. */
  .shot img {
    max-height: 40vh;
  }

  /* De kop draagt de stap: als balk onder de afbeelding, met de tekst eronder.
     De ruimte rechts houdt de sluitknop vrij. */
  .head {
    padding: 18px 52px 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .body {
    flex: 1 1 auto;
    padding: 16px 20px 4px;
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
