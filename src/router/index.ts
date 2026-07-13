import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/register/confirm',
      name: 'register-confirm',
      component: () => import('../views/RegisterConfirmView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { tab: 'home' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { tab: 'search' },
    },
    {
      path: '/titles/:id',
      name: 'title-detail',
      component: () => import('../views/TitleDetailView.vue'),
      props: true,
      meta: { tab: 'home' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { tab: 'settings' },
    },
    {
      path: '/settings/account',
      name: 'settings-account',
      component: () => import('../views/settings/AccountSettingsView.vue'),
      meta: { tab: 'settings' },
    },
    {
      path: '/settings/theme',
      name: 'settings-theme',
      component: () => import('../views/settings/ThemeSettingsView.vue'),
      meta: { tab: 'settings' },
    },
    {
      path: '/settings/requests',
      name: 'settings-requests',
      component: () => import('../views/settings/RequestsView.vue'),
      meta: { tab: 'settings' },
    },
    {
      path: '/settings/security',
      name: 'settings-security',
      component: () => import('../views/settings/SecuritySettingsView.vue'),
      meta: { tab: 'settings' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.init()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})

export default router
