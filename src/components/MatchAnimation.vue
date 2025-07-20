<template>
  <div v-if="show" class="match-animation-overlay" @click="close">
    <div class="match-animation-content" @click.stop>
      <div class="match-animation-header">
        <h2>¡Es un Match!</h2>
        <p>Tú y {{ matchedUser.name }} os habéis gustado</p>
      </div>
      
      <div class="match-animation-profiles">
        <div class="match-animation-profile">
          <div class="match-animation-avatar">
            <img :src="currentUserPhoto" :alt="currentUser.name">
          </div>
          <div class="match-animation-heart">❤️</div>
          <div class="match-animation-avatar">
            <img :src="matchedUserPhoto" :alt="matchedUser.name">
          </div>
        </div>
      </div>
      
      <div class="match-animation-actions">
        <button class="btn btn-primary" @click="sendMessage" :disabled="!props.matchId">
          Enviar mensaje
        </button>
        <button class="btn btn-secondary" @click="close">
          Seguir explorando
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{
  show: boolean;
  matchedUser: {
    id: string;
    name: string;
    photos?: string[];
  };
  currentUser: {
    id: string;
    name: string;
    photo?: string;
  };
  matchId: string;
}>();

// Computar las URLs de las fotos
const matchedUserPhoto = computed(() => {
  if (props.matchedUser.photos && props.matchedUser.photos.length > 0) {
    return props.matchedUser.photos[0];
  }
  return '/default-avatar.png';
});

const currentUserPhoto = computed(() => {
  // Intentar obtener la foto del usuario actual
  console.log('Foto del usuario actual:', props.currentUser.photo);
  return props.currentUser.photo || '/default-avatar.png';
});

const emit = defineEmits(['close', 'sendMessage']);

const close = () => {
  emit('close');
};

const sendMessage = () => {
  emit('sendMessage', props.matchId, props.matchedUser.id);
  close();
};

onMounted(() => {
  if (props.show) {
    // Reproducir sonido si está disponible
    const audio = new Audio('/match-sound.mp3');
    audio.play().catch(err => console.log('No se pudo reproducir el sonido', err));
  }
});
</script>

<style scoped>
.match-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.match-animation-content {
  background-color: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 90%;
  width: 400px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.5s ease-out;
}

.match-animation-header {
  margin-bottom: 2rem;
}

.match-animation-header h2 {
  color: var(--wa-green);
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: pulse 1.5s infinite;
}

.match-animation-header p {
  color: #666;
  font-size: 1.1rem;
}

.match-animation-profiles {
  margin-bottom: 2rem;
}

.match-animation-profile {
  display: flex;
  align-items: center;
  justify-content: center;
}

.match-animation-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--wa-green);
}

.match-animation-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.match-animation-heart {
  font-size: 2rem;
  margin: 0 1rem;
  animation: heartBeat 1s infinite;
}

.match-animation-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-animation-actions button {
  width: 100%;
  padding: 0.75rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.3); }
  60% { transform: scale(1); }
  100% { transform: scale(1); }
}

@media (max-width: 480px) {
  .match-animation-content {
    padding: 1.5rem;
  }
  
  .match-animation-avatar {
    width: 80px;
    height: 80px;
  }
}
</style>