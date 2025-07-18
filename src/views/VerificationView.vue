<template>
  <div class="verification-view">
    <header class="page-header">
      <h1>Verificación de Perfil</h1>
      <p>Verifica tu identidad para mayor seguridad</p>
    </header>
    
    <div class="verification-container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
      
      <div v-else-if="isVerified" class="already-verified">
        <div class="verified-badge">
          <span class="verified-icon">✓</span>
        </div>
        <h2>¡Perfil Verificado!</h2>
        <p>Tu perfil ya ha sido verificado correctamente.</p>
        <p class="verified-date">Verificado el {{ formatDate(verifiedAt) }}</p>
        <router-link to="/" class="btn-primary">Volver al Inicio</router-link>
      </div>
      
      <div v-else class="verification-content">
        <FaceVerification @complete="handleVerificationComplete" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import FaceVerification from '@/components/FaceVerification.vue';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const isVerified = ref(false);
const verifiedAt = ref<Date | null>(null);

onMounted(async () => {
  // Verificar si el usuario ya está verificado
  if (authStore.user?.isVerified) {
    isVerified.value = true;
    verifiedAt.value = authStore.user.verifiedAt || new Date();
  }
  
  loading.value = false;
});

const handleVerificationComplete = (success: boolean) => {
  if (success) {
    isVerified.value = true;
    verifiedAt.value = new Date();
    
    // Redirigir después de un breve retraso
    setTimeout(() => {
      router.push('/');
    }, 3000);
  }
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.verification-view {
  min-height: 100vh;
  background: var(--wa-bg);
}

.verification-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--wa-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.already-verified {
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.verified-badge {
  width: 100px;
  height: 100px;
  background: #e8f5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
}

.verified-icon {
  font-size: 3rem;
  color: var(--wa-green);
}

.already-verified h2 {
  color: var(--wa-green);
  margin-bottom: 1rem;
}

.already-verified p {
  color: #555;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.verified-date {
  color: #777;
  font-size: 0.9rem !important;
  margin-bottom: 2rem !important;
}

.btn-primary {
  background: var(--wa-green);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary:hover {
  background: var(--wa-green-dark);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .verification-container {
    padding: 1rem;
  }
  
  .already-verified {
    padding: 2rem 1rem;
  }
}
</style>