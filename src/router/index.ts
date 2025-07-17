import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfilesView from '../views/ProfilesView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import UserProfileView from '../views/UserProfileView.vue'
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/profiles',
      name: 'profiles',
      component: ProfilesView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/matches',
      name: 'matches',
      component: () => import('../views/MatchesView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/user/:id',
      name: 'user-profile',
      component: UserProfileView
    },
    {
      path: '/chat/:matchId',
      name: 'chat',
      component: () => import('../views/ChatView.vue')
    },
    {
      path: '/admin/reports',
      name: 'admin-reports',
      component: () => import('../views/AdminReportsView.vue'),
      meta: { requiresAdmin: true }
    }
  ]
});

// Guard global para rutas de admin
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAdmin) {
    // Si el usuario no es admin, redirigir al home
    if (!authStore.user || !authStore.user.isAdmin) {
      return next({ name: 'home' });
    }
  }
  next();
});

export default router;
