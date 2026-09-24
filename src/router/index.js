import { createRouter, createWebHistory } from 'vue-router'
import SchoolSearchView from '../views/SchoolSearchView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import PlannerView from '../views/PlannerView.vue'
import BulkExportView from '../views/BulkExportView.vue'
import SubjectEditView from '../views/SubjectEditView.vue'
import EditIndexView from '../views/EditIndexView.vue'
import { usePlannerStore } from '../stores/planner'
import { rememberSchool } from '../utils/schools'

// Welke vakken een scherm nodig heeft; null betekent alle vakken.
function subjectsForRoute(route) {
  if (route.name === 'planner') {
    return String(route.params.courses || '')
      .split('.')
      .map((course) => course.trim().toUpperCase())
      .filter(Boolean)
  }
  if (route.name === 'subjectEdit') {
    return [String(route.params.course || '').toUpperCase()]
  }
  return null
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'schoolSearch',
      component: SchoolSearchView,
    },
    // Alles van een school staat onder zijn adres: /hal, /hal/jaar/4/NL.EN, …
    {
      path: '/:school',
      children: [
        {
          path: '',
          name: 'onboarding',
          component: OnboardingView,
        },
        {
          path: 'jaar/:year/:courses',
          name: 'planner',
          component: PlannerView,
        },
        {
          path: 'export',
          name: 'bulkExport',
          component: BulkExportView,
        },
        {
          path: 'bewerklijst',
          name: 'editIndex',
          component: EditIndexView,
        },
        {
          path: 'bewerk/:year/:course',
          name: 'subjectEdit',
          component: SubjectEditView,
        },
        {
          path: ':pathMatch(.*)*',
          redirect: (to) => ({ name: 'onboarding', params: { school: to.params.school } }),
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// De schermen lezen de data direct uit de store; die is geladen voordat een
// scherm opent.
router.beforeEach(async (to) => {
  if (!to.params.school) {
    return true
  }

  // Links uit de tijd van PeriodePlanner (/#/jaar/4/NL.EN) komen na de
  // doorverwijzing binnen als /hal#/jaar/4/NL.EN.
  if (to.name === 'onboarding' && to.hash.startsWith('#/')) {
    return `/${to.params.school}${to.hash.slice(1)}`
  }

  const store = usePlannerStore()
  await store.loadSchool(to.params.school)
  if (store.status !== 'ready') {
    return true
  }

  // Altijd het echte adres in de adresbalk: /HAL wordt /hal, en het id-adres
  // van een inmiddels goedgekeurde school wordt zijn slug.
  if (to.params.school !== store.address) {
    return { name: to.name, params: { ...to.params, school: store.address }, query: to.query, hash: to.hash, replace: true }
  }

  await store.loadSubjects(subjectsForRoute(to))
  return true
})

router.afterEach((to) => {
  const store = usePlannerStore()
  if (to.params.school && store.status === 'ready' && !store.isPending) {
    rememberSchool(store.address, store.school.name)
  }
})

export default router
