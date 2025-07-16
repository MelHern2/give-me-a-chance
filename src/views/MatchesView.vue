<template>
  <div class="matches-view">
    <header class="page-header">
      <h1>Mis Matches</h1>
      <p>Personas con las que has hecho match</p>
    </header>
    
    <div class="matches-container">
      <div v-if="matches.length === 0" class="no-matches">
        <h3>Aún no tienes matches</h3>
        <p>Explora perfiles y haz match con personas que te interesen</p>
        <router-link to="/profiles" class="btn btn-primary">Explorar Perfiles</router-link>
      </div>
      
      <div v-else class="matches-grid">
        <div v-for="match in matches" :key="match.id" class="match-card">
          <div class="match-info">
            <h3>{{ match.name }}, {{ match.age }}</h3>
            <p>{{ match.city }}</p>
            <p class="match-date">Match desde {{ formatDate(match.createdAt) }}</p>
          </div>
          <div class="match-actions">
            <button
              :class="isAdmin ? 'btn-danger' : 'btn btn-primary'"
              @click="openChat(match.id)"
            >
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

    <!-- Modal de chat -->
    <div v-if="showChat" class="chat-modal">
      <div class="chat-box">
        <h3>Chat</h3>
        <div v-if="chatLoading">Cargando mensajes...</div>
        <div v-else class="chat-messages">
          <div v-for="msg in chatMessages" :key="msg.id" class="chat-message">
            <b>{{ msg.senderId === authStore.user?.id ? 'Tú' : 'Ell@' }}:</b> {{ msg.content }}
            <span class="msg-date">({{ formatDate(msg.createdAt) }})</span>
          </div>
        </div>
        <div class="chat-input-row">
          <input v-model="chatInput" @keyup.enter="handleSendMessage" placeholder="Escribe un mensaje..." />
          <button :class="isAdmin ? 'btn-danger' : 'btn btn-primary'" @click="handleSendMessage">Enviar</button>
          <button class="btn btn-secondary" @click="closeChat">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getMatches, deleteMatch } from '@/services/matches';
import { createReport } from '@/services/reports';
import { sendMessage, getMessages, subscribeToMessages } from '@/services/messaging';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.isAdmin);

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
const chatMatchId = ref<string | null>(null);
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
  // Aquí deberías mapear los datos reales de Firestore a la UI
  const data = await getMatches(authStore.user.id);
  // Suponiendo que tienes los nombres, etc. en los datos de matches o puedes obtenerlos
  matches.value = data.map(m => ({ ...m, name: '', age: 0, city: '' })); // Completar con datos reales
  subscribeAllMatches(data);
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

const openChat = async (matchId: string) => {
  chatMatchId.value = matchId;
  showChat.value = true;
  chatLoading.value = true;
  if (chatUnsubscribe.value) chatUnsubscribe.value();
  chatUnsubscribe.value = subscribeToMessages(matchId, msgs => {
    chatMessages.value = msgs;
    // Al abrir el chat, limpiar notificación
    newMessageNotification.value[matchId] = false;
  });
  chatLoading.value = false;
};

const closeChat = () => {
  showChat.value = false;
  chatMatchId.value = null;
  chatMessages.value = [];
  chatInput.value = '';
  if (chatUnsubscribe.value) chatUnsubscribe.value();
};

const handleSendMessage = async () => {
  if (!chatInput.value.trim() || !chatMatchId.value || !authStore.user) return;
  await sendMessage(chatMatchId.value, authStore.user.id, chatInput.value);
  chatMessages.value = await getMessages(chatMatchId.value);
  chatInput.value = '';
};

// Suscribirse a mensajes de todos los matches para notificaciones
const subscribeAllMatches = (matchesList: any[]) => {
  matchesList.forEach(match => {
    subscribeToMessages(match.id, msgs => {
      // Si el chat no está abierto para este match y hay mensajes nuevos, notificar
      if (!showChat.value || chatMatchId.value !== match.id) {
        newMessageNotification.value[match.id] = true;
      }
    });
  });
};

loadMatches();
</script>

<style scoped>
.matches-view {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2.5rem;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.matches-container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 2rem;
}

.no-matches {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.no-matches h3 {
  color: #333;
  margin-bottom: 1rem;
}

.no-matches p {
  color: #666;
  margin-bottom: 2rem;
}

.matches-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
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

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.chat-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.chat-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  padding: 2rem;
  min-width: 320px;
  max-width: 400px;
  width: 100%;
}
.chat-messages {
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1rem;
}
.chat-message {
  margin-bottom: 0.5rem;
}
.chat-input-row {
  display: flex;
  gap: 0.5rem;
}
input[type="text"], input[type="search"] {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.msg-badge {
  color: #dc3545;
  font-size: 1.2em;
  margin-left: 6px;
  vertical-align: middle;
}
</style> 