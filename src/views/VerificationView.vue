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
        <!-- Selección de tipo de verificación -->
        <div v-if="!selectedVerificationType" class="verification-options">
          <h2>Elige tu método de verificación</h2>
          <p>Selecciona la opción que mejor se adapte a tu dispositivo:</p>
          
          <div class="verification-cards">
            <!-- Opción 1: Verificación con foto (PC) -->
            <div class="verification-card" @click="selectVerificationType('photo')">
              <div class="card-icon">📷</div>
              <h3>Verificación con Foto</h3>
              <p>Ideal para PC y dispositivos de escritorio</p>
              <ul>
                <li>Foto de perfil clara</li>
                <li>Símbolo V con los dedos</li>
                <li>Proceso rápido y sencillo</li>
              </ul>
              <div class="card-badge">Recomendado para PC</div>
            </div>
            
            <!-- Opción 2: Super verificación (Móvil) -->
            <div class="verification-card" @click="selectVerificationType('liveness')">
              <div class="card-icon">🔐</div>
              <h3>Super Verificación</h3>
              <p>Verificación avanzada con detección de vida</p>
              <ul>
                <li>Detección de rostro en tiempo real</li>
                <li>Verificación de acciones (parpadear, sonreír)</li>
                <li>Máxima seguridad</li>
              </ul>
              <div class="card-badge">Recomendado para móvil</div>
            </div>
          </div>
        </div>
        
        <!-- Verificación con foto -->
        <div v-else-if="selectedVerificationType === 'photo'" class="photo-verification">
          <PhotoVerification @complete="handleVerificationComplete" />
        </div>
        
        <!-- Verificación con liveness -->
        <div v-else-if="selectedVerificationType === 'liveness'" class="liveness-verification">
        <FaceVerification @complete="handleVerificationComplete" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import FaceVerification from '@/components/FaceVerification.vue';
import PhotoVerification from '@/components/PhotoVerification.vue';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const isVerified = ref(false);
const verifiedAt = ref<Date | null>(null);
const selectedVerificationType = ref<'photo' | 'liveness' | null>(null);

onMounted(async () => {
  // Verificar si el usuario ya está verificado
  if (authStore.user?.isVerified) {
    isVerified.value = true;
    verifiedAt.value = authStore.user.verifiedAt || new Date();
  }
  
  loading.value = false;
});

const selectVerificationType = (type: 'photo' | 'liveness') => {
  selectedVerificationType.value = type;
};

const handleVerificationComplete = (success: boolean) => {
  console.log('🔄 Verificación completada con resultado:', success);
  
  if (success) {
    // Verificación exitosa
    isVerified.value = true;
    verifiedAt.value = new Date();
    
    // Redirigir después de un breve retraso
    setTimeout(() => {
      router.push('/');
    }, 3000);
  } else {
    // Verificación cancelada, fallida o saltada
    // Redirigir de vuelta al perfil
    router.push('/profile');
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

/* Opciones de verificación */
.verification-options {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.verification-options h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.verification-options > p {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.verification-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.verification-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.verification-card:hover {
  border-color: var(--wa-green);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.verification-card h3 {
  color: #333;
  margin-bottom: 0.5rem;
  text-align: center;
}

.verification-card p {
  color: #666;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.verification-card ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.verification-card li {
  color: #555;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  font-size: 0.9rem;
}

.verification-card li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--wa-green);
  font-weight: bold;
}

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--wa-green);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
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
  
  .verification-cards {
    grid-template-columns: 1fr;
  }
  
  .verification-card {
    padding: 1rem;
  }
}
</style>