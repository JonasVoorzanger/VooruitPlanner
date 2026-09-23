import { createRouter, createWebHashHistory } from 'vue-router'
import OnboardingView from '../views/OnboardingView.vue'
import PlannerView from '../views/PlannerView.vue'
import BulkExportView from '../views/BulkExportView.vue'
import SubjectEditView from '../views/SubjectEditView.vue'
import EditIndexView from '../views/EditIndexView.vue'
import { usePlannerStore } from '../stores/planner'

// Fase 1: nog één vaste school. In fase 2 komt de school uit het pad.
const SCHOOL_SLUG = 'hal'

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
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'onboarding',
      component: OnboardingView,
    },
    {
      path: '/jaar/:year/:courses',
      name: 'planner',
      component: PlannerView,
    },
    {
      path: '/export',
      name: 'bulkExport',
      component: BulkExportView,
    },
    {
      path: '/bewerklijst',
      name: 'editIndex',
      component: EditIndexView,
    },
    {
      path: '/bewerk/:year/:course',
      name: 'subjectEdit',
      component: SubjectEditView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// De schermen lezen de data direct uit de store; die is geladen voordat een
// scherm opent.
router.beforeEach(async (to) => {
  const store = usePlannerStore()
  await store.loadSchool(SCHOOL_SLUG)
  await store.loadSubjects(subjectsForRoute(to))
})

export default router
