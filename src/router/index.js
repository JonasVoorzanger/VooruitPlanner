import { createRouter, createWebHashHistory } from 'vue-router'
import OnboardingView from '../views/OnboardingView.vue'
import PlannerView from '../views/PlannerView.vue'
import BulkExportView from '../views/BulkExportView.vue'
import SubjectEditView from '../views/SubjectEditView.vue'
import EditIndexView from '../views/EditIndexView.vue'

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

export default router
