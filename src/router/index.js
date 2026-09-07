import { createRouter, createWebHashHistory } from 'vue-router'
import OnboardingView from '../views/OnboardingView.vue'
import PlannerView from '../views/PlannerView.vue'
import UploadView from '../views/UploadView.vue'
import SettingsView from '../views/SettingsView.vue'
import BulkExportView from '../views/BulkExportView.vue'
import SubjectEditView from '../views/SubjectEditView.vue'

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
      path: '/upload',
      name: 'upload',
      component: UploadView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/export',
      name: 'bulkExport',
      component: BulkExportView,
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
