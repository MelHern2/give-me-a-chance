import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfilesView from '../views/ProfilesView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import UserProfileView from '../views/UserProfileView.vue'
import TermsView from '../views/TermsView.vue'
import VerificationView from '../views/VerificationView.vue'
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
      path: '/terms',
      name: 'terms',
      component: TermsView
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
    },
    {
      path: '/verification',
      name: 'verification',
      component: VerificationView,
      meta: { requiresAuth: true }
    }
  ]
});

// Guard global para verificar términos, verificación y admin
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // Si el usuario está autenticado pero no ha aceptado los términos
  if (authStore.isAuthenticated && !authStore.hasAcceptedTerms && to.name !== 'terms') {
    return next({ name: 'terms' });
  }
  
  // Si el usuario no está autenticado y no va a login/register, redirigir a login
  if (!authStore.isAuthenticated && to.name !== 'login' && to.name !== 'register') {
    return next({ name: 'login' });
  }
  
  // Si el usuario va a términos pero ya los aceptó, redirigir al home
  if (to.name === 'terms' && authStore.hasAcceptedTerms) {
    return next({ name: 'home' });
  }
  
  // Verificar si el usuario necesita verificación
  const requiresVerification = ['profiles', 'matches', 'chat'].includes(to.name as string);
  if (authStore.isAuthenticated && requiresVerification && !authStore.user?.isVerified && to.name !== 'verification') {
    return next({ name: 'verification' });
  }
  
  // Verificar rutas de admin
  if (to.meta.requiresAdmin) {
    if (!authStore.user || !authStore.user.isAdmin) {
      return next({ name: 'home' });
    }
  }
  
  next();
});

export default router;
