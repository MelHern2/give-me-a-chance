<template>
  <div class="matches-view">
    <header class="page-header">
      <h1>Mis Matches</h1>
      <p>Personas con las que has hecho match</p>
    </header>
    <div class="matches-container">
      <!-- Sin matches -->
      <div v-if="matches.length === 0 && pendingMatches.length === 0" class="no-matches card">
        <h3>Aún no tienes matches</h3>
        <p>Explora perfiles y haz match con personas que te interesen</p>
        <router-link to="/profiles" class="btn">Explorar Perfiles</router-link>
      </div>
      
      <!-- Matches pendientes (nuevos) -->
      <div v-if="pendingMatches.length > 0" class="pending-matches-section">
        <h2 class="section-title">🔔 Matches nuevos ({{ pendingMatches.length }})</h2>
        <p class="section-subtitle">Estos matches están esperando tu primer mensaje</p>
        
        <div class="matches-list">
          <div v-for="match in pendingMatches" :key="match.id" class="match-list-item pending-item" :data-match-id="match.id">
            <div class="match-avatar">
              <img :src="match.photo || '/default-avatar.png'" :alt="match.name" @click="goToUserProfile(match.userId || '')">
              <div class="pending-badge">🔔</div>
            </div>
            <div class="match-list-info">
              <h3>{{ match.name }}, {{ match.age }}</h3>
              <p>{{ match.city }}</p>
            </div>
            <div class="match-list-actions">
              <button class="btn btn-primary" @click="openChat(match.id, match.userId || '')">
                Mensaje
              </button>
              <button class="btn btn-danger" @click="handleUnmatch(match.id)" title="Deshacer match">
                ❌
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Matches con conversaciones (antiguos) -->
      <div v-if="regularMatches.length > 0" class="regular-matches-section">
        <h2 class="section-title">Conversaciones activas ({{ regularMatches.length }})</h2>
        
        <div class="matches-list">
          <div v-for="match in regularMatches" :key="match.id" class="match-list-item" :data-match-id="match.id">
            <div class="match-avatar">
              <img :src="match.photo || '/default-avatar.png'" :alt="match.name" @click="goToUserProfile(match.userId || '')">
              <div v-if="newMessageNotification[match.id]" class="notification-badge">💬</div>
            </div>
            <div class="match-list-info">
              <h3>{{ match.name }}, {{ match.age }}</h3>
              <p>{{ match.city }}</p>
            </div>
            <div class="match-list-actions">
              <button class="btn btn-primary" @click="openChat(match.id, match.userId || '')">
                Mensaje
                <span v-if="newMessageNotification[match.id]" class="msg-badge">●</span>
              </button>
              <button class="btn btn-danger" @click="handleUnmatch(match.id)" title="Deshacer match">
                ❌
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ChatView v-if="showChat" :matchId="selectedMatchId || undefined" :userId="selectedUserId || undefined" :onClose="closeChat" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getMatches, deleteMatch } from '@/services/matches';
import { createReport } from '@/services/reports';
import { sendMessage, getMessages, subscribeToMessages } from '@/services/messaging';
import { useAuthStore } from '@/stores/auth';
import { getProfileById } from '@/services/profiles';
import { getPendingMatches, type PendingMatch } from '@/services/pendingMatches';

import ChatView from './ChatView.vue';
import { removeAllLikesBetweenUsers } from '@/services/likes';
import { removeAllDislikesBetweenUsers } from '@/services/dislikes';
import { useNotificationsStore } from '@/stores/notifications';
import { usePendingMatchesStore } from '@/stores/pendingMatches';

const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const pendingMatchesStore = usePendingMatchesStore();
const router = useRouter();
const isAdmin = computed(() => authStore.user?.isAdmin);

// Propiedad computada para obtener los matches regulares (no pendientes)
const regularMatches = computed(() => {
  return matches.value.filter(match => !isPendingMatch(match.id));
});


interface Match {
  id: string;
  name: string;
  age: number;
  city: string;
  photo?: string;
  createdAt: Date;
  users?: [string, string];
  userId?: string;
  isVerified?: boolean;
  isSuperVerified?: boolean;
}

const matches = ref<Match[]>([]);
const pendingMatches = ref<PendingMatch[]>([]);
const pendingMatchIds = ref<string[]>([]);

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
            photo: userProfile.photos && userProfile.photos.length > 0 ? userProfile.photos[0] : '',
            userId: otherUserId,
            isVerified: userProfile.isVerified,
            isSuperVerified: userProfile.isSuperVerified,
          };
        } catch (error) {
          console.error('❌ Error obteniendo perfil de usuario:', otherUserId, error);
          return null;
        }
      })
    );
    
    // Filtrar matches nulos y actualizar el estado
    matches.value = matchesWithUserData.filter((match): match is NonNullable<typeof match> => match !== null);
    console.log('✅ Matches cargados:', matches.value.length);
    
    // Cargar matches pendientes (sin mensajes)
    loadPendingMatches();
    
    subscribeAllMatches(data);
  } catch (error) {
    console.error('❌ Error cargando matches:', error);
  }
};

const loadPendingMatches = async () => {
  if (!authStore.user) return;
  
  try {
    console.log('🔄 Cargando matches pendientes...');
    const pending = await getPendingMatches(authStore.user.id);
    pendingMatches.value = pending;
    pendingMatchIds.value = pending.map(match => match.id);
    // Actualizar el store de matches pendientes
    await pendingMatchesStore.loadPendingMatches(authStore.user.id);
    console.log('✅ Matches pendientes cargados:', pendingMatches.value.length);
  } catch (error) {
    console.error('❌ Error cargando matches pendientes:', error);
  }
};

// Función para verificar si un match está pendiente
const isPendingMatch = (matchId: string): boolean => {
  return pendingMatchIds.value.includes(matchId);
};

const handleUnmatch = async (matchId: string) => {
  // Validar que matchId no sea undefined
  if (!matchId) {
    console.error('❌ Error: matchId es undefined en handleUnmatch');
    notificationsStore.error('Error', 'No se pudo deshacer el match. Inténtalo de nuevo.');
    return;
  }
  
  // Determinar si es un match pendiente o regular
  const isPending = isPendingMatch(matchId);
  const matchType = isPending ? 'pendiente' : 'regular';
  
  // Confirmar la acción usando notificaciones internas
  notificationsStore.confirm(
    'Confirmar acción',
    `¿Estás seguro de que quieres deshacer este match ${matchType}?\n\nEsta acción no se puede deshacer y reiniciará el estado de interacción con el perfil.`,
    async () => {
      // Continuar con la eliminación del match
      await performUnmatch(matchId, isPending, matchType);
    }
  );
  
  return;
};

const performUnmatch = async (matchId: string, isPending: boolean, matchType: string) => {
  
  try {
    console.log(`🗑️ Deshaciendo match ${matchType}:`, matchId);
    
    // Mostrar indicador de carga
    const matchElement = document.querySelector(`[data-match-id="${matchId}"]`) as HTMLElement;
    if (matchElement) {
      matchElement.style.opacity = '0.5';
    }
    
    // Obtener el ID del otro usuario en el match
    const match = isPending 
      ? pendingMatches.value.find(m => m.id === matchId)
      : matches.value.find(m => m.id === matchId);
    
    if (!match || !match.userId || !authStore.user) {
      console.error('❌ Error: No se pudo obtener información del match');
      notificationsStore.error('Error', 'No se pudo obtener información del match.');
      return;
    }
    
    const otherUserId = match.userId;
    const currentUserId = authStore.user.id;
    
    console.log('👥 Eliminando interacciones entre usuarios:', currentUserId, 'y', otherUserId);
    
    // Eliminar el match de Firestore
    await deleteMatch(matchId);
    
    // Eliminar likes y dislikes entre los usuarios para reiniciar completamente las interacciones
    await removeAllLikesBetweenUsers(currentUserId, otherUserId);
    await removeAllDislikesBetweenUsers(currentUserId, otherUserId);
    
    // Eliminar de la lista local según el tipo
    if (isPending) {
      pendingMatchIds.value = pendingMatchIds.value.filter(id => id !== matchId);
      pendingMatches.value = pendingMatches.value.filter(match => match.id !== matchId);
      // Actualizar el store de matches pendientes
      pendingMatchesStore.removePendingMatch(matchId);
    } else {
      matches.value = matches.value.filter(m => m.id !== matchId);
    }
    
    // Forzar actualización de la vista
    await nextTick();

    // Recargar la lista de matches desde Firestore para asegurar sincronización
    await loadMatches();

    console.log(`✅ Match ${matchType} eliminado correctamente`);
    console.log('🔄 Estado de interacción reiniciado');
    console.log(`📊 Matches restantes: ${matches.value.length}`);
    
    // Mostrar mensaje de éxito
    notificationsStore.success('Éxito', `Match ${matchType} eliminado correctamente.\n\nEl estado de interacción con este perfil se ha reiniciado.`);
    
    // Emitir evento para recargar perfiles (para que el perfil vuelva a aparecer en la lista)
    window.dispatchEvent(new CustomEvent('match-removed', { 
      detail: { 
        removedUserId: otherUserId,
        currentUserId: currentUserId 
      } 
    }));
    
  } catch (error) {
    console.error(`❌ Error eliminando match ${matchType}:`, error);
    notificationsStore.error('Error', 'Error al eliminar el match. Inténtalo de nuevo.');
    
    // Restaurar opacidad si falló
    const matchElement = document.querySelector(`[data-match-id="${matchId}"]`) as HTMLElement;
    if (matchElement) {
      matchElement.style.opacity = '1';
    }
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
  notificationsStore.success('Reporte enviado', 'Usuario reportado. ¡Gracias por ayudarnos a mantener la comunidad segura!');
};

const openChat = async (matchId: string, userId: string) => {
  // Validar que matchId y userId no sean undefined o null
  if (!matchId || !userId) {
    console.error('❌ Error: matchId o userId son undefined/null:', { matchId, userId });
    notificationsStore.error('Error', 'No se pudo abrir el chat. Inténtalo de nuevo.');
    return;
  }
  
  console.log('💬 Abriendo chat:', { matchId, userId });
  selectedMatchId.value = matchId;
  selectedUserId.value = userId;
  showChat.value = true;
  
  // Si es un match pendiente, moverlo a conversaciones activas
  if (isPendingMatch(matchId)) {
    // Eliminar de la lista de matches pendientes
    pendingMatchIds.value = pendingMatchIds.value.filter(id => id !== matchId);
    
    // Actualizar la lista de matches pendientes
    pendingMatches.value = pendingMatches.value.filter(match => match.id !== matchId);
    
    // Forzar actualización de la vista
    await nextTick();
  }
};

const closeChat = () => {
  showChat.value = false;
  selectedMatchId.value = null;
  selectedUserId.value = null;
};





const goToUserProfile = (userId: string) => {
  router.push(`/user/${userId}`);
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
  
  // Listener para cuando se envía el primer mensaje y un match pendiente se convierte en activo
  const handleFirstMessageSent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { matchId } = customEvent.detail;
    console.log('📨 Primer mensaje enviado para match:', matchId);
    
    // Remover el match de la lista de pendientes
    pendingMatchIds.value = pendingMatchIds.value.filter(id => id !== matchId);
    pendingMatches.value = pendingMatches.value.filter(match => match.id !== matchId);
    
    // Recargar matches para asegurar sincronización
    loadMatches();
  };
  
  window.addEventListener('first-message-sent', handleFirstMessageSent);
  
  // Cleanup al desmontar
  onUnmounted(() => {
    window.removeEventListener('first-message-sent', handleFirstMessageSent);
  });
});

// Watcher para cuando el usuario se autentica
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    loadMatches();
  }
}, { immediate: true });

// Watcher para recargar matches cuando cambie la lista
watch(matches, (newMatches) => {
  console.log('🔄 Lista de matches actualizada:', newMatches.length);
}, { deep: true });
</script>

<style scoped>
.matches-view {
  min-height: 100vh;
  background: var(--wa-bg);
}
.matches-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
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
.section-title {
  color: var(--wa-green);
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.section-subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.pending-matches-section {
  margin-bottom: 3rem;
}

.regular-matches-section {
  margin-bottom: 2rem;
}

.pending-card {
  border: 2px solid var(--wa-green);
}

/* Estilos para formato lista */
.matches-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.match-list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.match-list-item:hover {
  transform: translateX(5px);
}

.pending-item {
  border-left: 4px solid var(--wa-green);
}

.match-avatar {
  position: relative;
  margin-right: 1rem;
  width: 60px;
  height: 60px;
}

.match-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.match-list-info {
  flex: 1;
}

.match-list-info h3 {
  margin: 0 0 0.25rem 0;
  color: var(--wa-green);
  font-size: 1.1rem;
}

.match-list-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.match-list-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-danger:active {
  background: #bd2130;
}

.notification-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: var(--wa-accent);
  color: #333;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 2px solid white;
}
.msg-badge {
  color: var(--wa-danger);
  font-size: 1.2em;
  margin-left: 6px;
  vertical-align: middle;
}

/* Estilos para el indicador de match pendiente */
.pending-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: var(--wa-green);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  animation: pulse 1.5s infinite;
  border: 2px solid white;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Estilos para el estado de verificación */
.verification-status {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.verification-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.super-verified {
  background-color: #e6ffea;
  color: #38a169;
  border: 1px solid #a8e6b4;
}

.verified {
  background-color: #e6ffea;
  color: #38a169;
  border: 1px solid #a8e6b4;
}

.badge-icon {
  font-size: 1rem;
}

.badge-text {
  font-weight: 600;
}
</style> 