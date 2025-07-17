<template>
  <div class="matches-view">
    <header class="page-header">
      <h1>Mis Matches</h1>
      <p>Personas con las que has hecho match</p>
    </header>
    <div class="matches-container matches-grid">
      <div v-if="matches.length > 0" class="matches-header card">
        <h2>Matches encontrados: {{ matches.length }}</h2>
        <button @click="loadMatches" class="btn btn-secondary">🔄 Recargar</button>
      </div>
      <div v-if="matches.length === 0" class="no-matches card">
        <h3>Aún no tienes matches</h3>
        <p>Explora perfiles y haz match con personas que te interesen</p>
        <router-link to="/profiles" class="btn">Explorar Perfiles</router-link>
        <button @click="loadMatches" class="btn btn-secondary" style="margin-top: 1rem;">🔄 Recargar Matches</button>
      </div>
      <div v-else class="matches-grid">
        <div v-for="match in matches" :key="match.id" class="match-card card">
          <div class="match-info">
            <h3>{{ match.name }}, {{ match.age }}</h3>
            <p>{{ match.city }}</p>
            <p class="match-date">Match desde {{ formatDate(match.createdAt) }}</p>
          </div>
          <div class="match-actions">
            <button :class="isAdmin ? 'btn-danger' : 'btn'" @click="openChat(match.id, match.userId)">
              Enviar Mensaje
              <span v-if="newMessageNotification[match.id]" class="msg-badge">●</span>
            </button>
            <button class="btn btn-secondary">Ver Perfil</button>
            <button class="btn btn-danger" @click="handleUnmatch(match.id)">Deshacer Match</button>
            <button class="btn btn-warning" @click="handleReport(match.users?.find(u => u !== authStore.user?.id) || '')">Reportar Usuario</button>
          </div>
        </div>
      </div>
    </div>
    <ChatView v-if="showChat" :matchId="selectedMatchId" :userId="selectedUserId" :onClose="closeChat" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { getMatches, deleteMatch } from '@/services/matches';
import { createReport } from '@/services/reports';
import { sendMessage, getMessages, subscribeToMessages } from '@/services/messaging';
import { useAuthStore } from '@/stores/auth';
import { getProfileById } from '@/services/profiles';
import { useRouter } from 'vue-router';
import ChatView from './ChatView.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.isAdmin);
const router = useRouter();

interface Match {
  id: string;
  name: string;
  age: number;
  city: string;
  createdAt: Date;
  users?: [string, string];
}

const matches = ref<Match[]>([]);

// Chat state
const showChat = ref(false);
const selectedMatchId = ref<string | null>(null);
const selectedUserId = ref<string | null>(null);
const chatMessages = ref<any[]>([]);
const chatInput = ref('');
const chatLoading = ref(false);

const chatUnsubscribe = ref<null | (() => void)>(null);
const newMessageNotification = ref<{[matchId: string]: boolean}>({});

const formatDate = (date: Date) => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const loadMatches = async () => {
  if (!authStore.user) return;
  
  try {
    console.log('🔄 Cargando matches para usuario:', authStore.user.id);
    const data = await getMatches(authStore.user.id);
    console.log('📊 Matches obtenidos:', data.length);
    
    // Obtener datos completos de cada usuario en el match
    const matchesWithUserData = await Promise.all(
      data.map(async (match) => {
        // Obtener el ID del otro usuario en el match
        const otherUserId = match.users.find(id => id !== authStore.user!.id);
        if (!otherUserId) {
          console.log('❌ No se encontró el otro usuario en el match');
          return null;
        }
        
        try {
          // Obtener el perfil completo del otro usuario
          const userProfile = await getProfileById(otherUserId);
          console.log('👤 Perfil obtenido:', userProfile.name);
          
          return {
            ...match,
            name: userProfile.name,
            age: userProfile.age,
            city: userProfile.city,
            userId: otherUserId
          };
        } catch (error) {
          console.error('❌ Error obteniendo perfil de usuario:', otherUserId, error);
          return null;
        }
      })
    );
    
    // Filtrar matches nulos y actualizar el estado
    matches.value = matchesWithUserData.filter(match => match !== null);
    console.log('✅ Matches cargados:', matches.value.length);
    
    subscribeAllMatches(data);
  } catch (error) {
    console.error('❌ Error cargando matches:', error);
  }
};

const handleUnmatch = async (matchId: string) => {
  if (confirm('¿Estás seguro de que quieres deshacer este match?')) {
    await deleteMatch(matchId);
    matches.value = matches.value.filter(m => m.id !== matchId);
  }
};

const handleReport = async (reportedUserId: string) => {
  const reason = prompt('Explica el motivo del reporte:');
  if (!reason || !authStore.user) return;
  await createReport({
    reporterId: authStore.user.id,
    reportedUserId,
    reason,
  });
  alert('Usuario reportado. ¡Gracias por ayudarnos a mantener la comunidad segura!');
};

const openChat = (matchId: string, userId: string) => {
  selectedMatchId.value = matchId;
  selectedUserId.value = userId;
  showChat.value = true;
};

const closeChat = () => {
  showChat.value = false;
  selectedMatchId.value = null;
  selectedUserId.value = null;
};

const handleSendMessage = async () => {
  if (!chatInput.value.trim() || !chatMatchId.value || !authStore.user) return;
  await sendMessage(chatMatchId.value, authStore.user.id, chatInput.value);
  chatMessages.value = await getMessages(chatMatchId.value);
  chatInput.value = '';
};

const goToChat = (matchId: string, userId: string) => {
  // Navegar a la vista de chat pasando el userId del otro usuario
  router.push({ name: 'chat', params: { matchId }, query: { userId } });
};

// Suscribirse a mensajes de todos los matches para notificaciones
const subscribeAllMatches = (matchesList: any[]) => {
  matchesList.forEach(match => {
    subscribeToMessages(match.id, msgs => {
      // Si el chat no está abierto para este match y hay mensajes nuevos, notificar
      if (!showChat.value || selectedMatchId.value !== match.id) {
        newMessageNotification.value[match.id] = true;
      }
    });
  });
};

// Cargar matches cuando el componente se monte
onMounted(() => {
  if (authStore.user) {
    loadMatches();
  }
});

// Watcher para cuando el usuario se autentica
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    loadMatches();
  }
}, { immediate: true });
</script>

<style scoped>
.matches-view {
  min-height: 100vh;
  background: var(--wa-bg);
}
.matches-container {
  width: 100%;
  margin: 0;
  padding: 2rem;
}
.matches-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.no-matches {
  text-align: center;
  padding: 4rem 2rem;
}
.match-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.match-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--wa-green);
}
.match-info p {
  margin: 0 0 0.25rem 0;
  color: #666;
}
.match-date {
  font-size: 0.9rem;
  color: #999;
}
.match-actions {
  display: flex;
  gap: 0.5rem;
}
.msg-badge {
  color: var(--wa-danger);
  font-size: 1.2em;
  margin-left: 6px;
  vertical-align: middle;
}
</style> 