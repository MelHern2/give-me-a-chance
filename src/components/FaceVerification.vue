<template>
  <div class="face-verification">
    <div v-if="!modelsLoaded" class="loading-models">
      <div class="spinner"></div>
      <p>Cargando modelos de reconocimiento facial...</p>
    </div>
    
    <div v-else class="verification-container">
      <!-- Paso 1: Instrucciones iniciales -->
      <div v-if="step === 'intro'" class="verification-step">
        <h2>Verificación de Perfil</h2>
        <p>Para garantizar la seguridad de todos los usuarios, necesitamos verificar tu identidad.</p>
        <p>Este proceso es rápido y sencillo:</p>
        <ol>
          <li>Tomaremos una foto de tu rostro</li>
          <li>Te pediremos realizar algunas acciones simples</li>
          <li>Verificaremos que eres una persona real</li>
        </ol>
        <p>Asegúrate de estar en un lugar bien iluminado y que tu rostro sea claramente visible.</p>
        <button @click="startVerification" class="btn-primary">Comenzar Verificación</button>
      </div>
      
      <!-- Paso 2: Captura de foto de perfil -->
      <div v-else-if="step === 'capture'" class="verification-step">
        <h2>Captura de Foto</h2>
        <p>Posiciona tu rostro dentro del marco y mantente quieto.</p>
        
        <div class="camera-container">
          <video ref="videoElement" autoplay muted playsinline class="camera-feed"></video>
          <canvas ref="canvasElement" class="face-canvas"></canvas>
          <div class="face-outline"></div>
        </div>
        
        <div class="camera-controls">
          <button @click="capturePhoto" class="btn-primary" :disabled="!faceDetected">
            {{ faceDetected ? 'Tomar Foto' : 'Esperando rostro...' }}
          </button>
          <button @click="resetVerification" class="btn-secondary">Cancelar</button>
        </div>
      </div>
      
      <!-- Paso 3: Verificación de vida -->
      <div v-else-if="step === 'liveness'" class="verification-step">
        <h2>Verificación de Vida</h2>
        <p>Por favor, realiza las siguientes acciones cuando se te indique:</p>
        
        <div class="liveness-actions">
          <div 
            v-for="(action, index) in requiredActions" 
            :key="action"
            :class="['liveness-action', { 'completed': completedActions.includes(action) }]"
          >
            <span class="action-number">{{ index + 1 }}</span>
            <span class="action-text">{{ getActionText(action) }}</span>
            <span v-if="completedActions.includes(action)" class="action-check">✓</span>
          </div>
        </div>
        
        <div class="camera-container">
          <video ref="videoElement" autoplay muted playsinline class="camera-feed"></video>
          <canvas ref="canvasElement" class="face-canvas"></canvas>
          <div class="current-action" v-if="currentAction">
            {{ getActionText(currentAction) }}
          </div>
        </div>
        
        <div class="verification-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${verificationProgress}%` }"></div>
          </div>
          <p>{{ completedActions.length }} de {{ requiredActions.length }} acciones completadas</p>
        </div>
        
        <div class="camera-controls">
          <button @click="resetVerification" class="btn-secondary">Cancelar</button>
        </div>
      </div>
      
      <!-- Paso 4: Resultado -->
      <div v-else-if="step === 'result'" class="verification-step">
        <div v-if="verificationSuccess" class="verification-success">
          <div class="success-icon">✓</div>
          <h2>¡Verificación Exitosa!</h2>
          <p>Tu perfil ha sido verificado correctamente.</p>
          <p>Ahora puedes disfrutar de todas las funciones de la aplicación.</p>
        </div>
        
        <div v-else class="verification-failed">
          <div class="failed-icon">✗</div>
          <h2>Verificación Fallida</h2>
          <p>No pudimos completar la verificación de tu perfil.</p>
          <p>{{ errorMessage }}</p>
        </div>
        
        <div class="result-actions">
          <button v-if="!verificationSuccess" @click="startVerification" class="btn-primary">Intentar de nuevo</button>
          <button @click="finishVerification" class="btn-secondary">{{ verificationSuccess ? 'Continuar' : 'Volver' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  loadFaceModels, 
  detectFace, 
  startLivenessCheck, 
  verifyLivenessAction, 
  completeLivenessCheck 
} from '@/services/verification';
import { useAuthStore } from '@/stores/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Props y emits
const props = defineProps<{
  onComplete?: (success: boolean) => void;
}>();

const emit = defineEmits(['complete']);

// Referencias a elementos DOM
const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);

// Estado de la verificación
const modelsLoaded = ref(false);
const step = ref<'intro' | 'capture' | 'liveness' | 'result'>('intro');
const faceDetected = ref(false);
const profilePhoto = ref<string | null>(null);
const verificationSuccess = ref(false);
const errorMessage = ref('');

// Estado de la verificación de vida
const requiredActions = ref<string[]>([]);
const completedActions = ref<string[]>([]);
const currentAction = ref<string | null>(null);
const verificationProgress = computed(() => {
  if (requiredActions.value.length === 0) return 0;
  return (completedActions.value.length / requiredActions.value.length) * 100;
});

// Stream de la cámara
let videoStream: MediaStream | null = null;

// Auth store
const authStore = useAuthStore();

// Cargar modelos al montar el componente
onMounted(async () => {
  try {
    await loadFaceModels();
    modelsLoaded.value = true;
  } catch (error) {
    console.error('Error cargando modelos:', error);
    errorMessage.value = 'No se pudieron cargar los modelos de reconocimiento facial. Por favor, intenta de nuevo más tarde.';
    step.value = 'result';
  }
});

// Limpiar recursos al desmontar
onUnmounted(() => {
  stopCamera();
});

// Iniciar verificación
const startVerification = async () => {
  step.value = 'capture';
  await startCamera();
  startFaceDetection();
};

// Iniciar cámara
const startCamera = async () => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoElement.value) {
        videoElement.value.srcObject = videoStream;
      }
    } else {
      throw new Error('getUserMedia no está soportado en este navegador');
    }
  } catch (error) {
    console.error('Error accediendo a la cámara:', error);
    errorMessage.value = 'No se pudo acceder a la cámara. Por favor, verifica los permisos y vuelve a intentarlo.';
    step.value = 'result';
  }
};

// Detener cámara
const stopCamera = () => {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
};

// Detección continua de rostro
const startFaceDetection = () => {
  const detectInterval = setInterval(async () => {
    if (step.value !== 'capture' && step.value !== 'liveness') {
      clearInterval(detectInterval);
      return;
    }
    
    if (videoElement.value) {
      const detection = await detectFace(videoElement.value);
      faceDetected.value = !!detection;
      
      // Si estamos en verificación de vida, verificar la acción actual
      if (step.value === 'liveness' && currentAction.value && faceDetected.value) {
        checkCurrentAction();
      }
      
      // Dibujar detección en el canvas
      drawDetection(detection);
    }
  }, 200);
};

// Dibujar detección en el canvas
const drawDetection = (detection: any) => {
  if (!canvasElement.value || !videoElement.value) return;
  
  const ctx = canvasElement.value.getContext('2d');
  if (!ctx) return;
  
  // Ajustar tamaño del canvas
  canvasElement.value.width = videoElement.value.videoWidth;
  canvasElement.value.height = videoElement.value.videoHeight;
  
  // Limpiar canvas
  ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height);
  
  // Dibujar rectángulo de detección si hay un rostro
  if (detection) {
    const { box } = detection;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
};

// Capturar foto
const capturePhoto = () => {
  if (!videoElement.value || !canvasElement.value) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.value.videoWidth;
  canvas.height = videoElement.value.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Dibujar frame actual del video en el canvas
  ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height);
  
  // Convertir a base64
  profilePhoto.value = canvas.toDataURL('image/jpeg');
  
  // Pasar a verificación de vida
  startLivenessVerification();
};

// Iniciar verificación de vida
const startLivenessVerification = () => {
  step.value = 'liveness';
  completedActions.value = [];
  requiredActions.value = startLivenessCheck();
  currentAction.value = requiredActions.value[0];
};

// Verificar acción actual
const checkCurrentAction = async () => {
  if (!currentAction.value || !videoElement.value) return;
  
  const actionCompleted = await verifyLivenessAction(videoElement.value, currentAction.value);
  
  if (actionCompleted && !completedActions.value.includes(currentAction.value)) {
    completedActions.value.push(currentAction.value);
    
    // Pasar a la siguiente acción o finalizar
    const nextActionIndex = requiredActions.value.findIndex(a => a === currentAction.value) + 1;
    
    if (nextActionIndex < requiredActions.value.length) {
      currentAction.value = requiredActions.value[nextActionIndex];
    } else {
      // Todas las acciones completadas
      finishLivenessCheck();
    }
  }
};

// Finalizar verificación de vida
const finishLivenessCheck = async () => {
  const success = completedActions.value.length === requiredActions.value.length;
  const score = success ? 0.95 : 0;
  
  completeLivenessCheck(success, score);
  
  if (success) {
    // Guardar estado de verificación
    await saveVerificationStatus();
    verificationSuccess.value = true;
  } else {
    errorMessage.value = 'No se pudieron completar todas las acciones requeridas.';
    verificationSuccess.value = false;
  }
  
  step.value = 'result';
};

// Guardar estado de verificación
const saveVerificationStatus = async () => {
  if (!authStore.user) return;
  
  try {
    // Actualizar estado de verificación en Firestore
    const userRef = doc(db, 'users', authStore.user.id);
    await updateDoc(userRef, {
      isVerified: true,
      verifiedAt: new Date(),
      verificationPhoto: profilePhoto.value
    });
    
    // Actualizar usuario en el store
    authStore.setUser({
      ...authStore.user,
      isVerified: true,
      verifiedAt: new Date()
    });
    
    console.log('✅ Verificación guardada correctamente');
  } catch (error) {
    console.error('❌ Error guardando verificación:', error);
    throw error;
  }
};

// Resetear verificación
const resetVerification = () => {
  stopCamera();
  step.value = 'intro';
  faceDetected.value = false;
  profilePhoto.value = null;
  completedActions.value = [];
  currentAction.value = null;
};

// Finalizar verificación
const finishVerification = () => {
  stopCamera();
  emit('complete', verificationSuccess.value);
};

// Obtener texto descriptivo para cada acción
const getActionText = (action: string): string => {
  switch (action) {
    case 'blink':
      return 'Parpadea lentamente';
    case 'smile':
      return 'Sonríe';
    case 'turn_head_left':
      return 'Gira la cabeza a la izquierda';
    case 'turn_head_right':
      return 'Gira la cabeza a la derecha';
    default:
      return action;
  }
};
</script>

<style scoped>
.face-verification {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.loading-models {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
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

.verification-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.verification-step {
  padding: 1.5rem;
}

.verification-step h2 {
  color: var(--wa-green);
  margin-bottom: 1rem;
  text-align: center;
}

.verification-step p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.verification-step ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.verification-step li {
  margin-bottom: 0.5rem;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
  margin: 1.5rem 0;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.camera-feed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.face-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.face-outline {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 2px dashed rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  pointer-events: none;
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
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
}

.btn-primary:hover {
  background: var(--wa-green-dark);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: white;
  color: var(--wa-green);
  border: 2px solid var(--wa-green);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f0f0f0;
}

.liveness-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.liveness-action {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.2s;
}

.liveness-action.completed {
  background: #e8f5e9;
  border-left: 4px solid var(--wa-green);
}

.action-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #ddd;
  border-radius: 50%;
  margin-right: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.liveness-action.completed .action-number {
  background: var(--wa-green);
  color: white;
}

.action-text {
  flex: 1;
}

.action-check {
  color: var(--wa-green);
  font-weight: bold;
  font-size: 1.2rem;
}

.current-action {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
  100% { transform: translateX(-50%) scale(1); }
}

.verification-progress {
  margin: 1.5rem 0;
  text-align: center;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--wa-green);
  transition: width 0.3s ease;
}

.verification-success,
.verification-failed {
  text-align: center;
  padding: 2rem 1rem;
}

.success-icon,
.failed-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2.5rem;
}

.success-icon {
  background: #e8f5e9;
  color: var(--wa-green);
}

.failed-icon {
  background: #ffebee;
  color: #f44336;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 480px) {
  .face-verification {
    padding: 0.5rem;
  }
  
  .verification-step {
    padding: 1rem;
  }
  
  .camera-controls {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>