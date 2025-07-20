<template>
  <div :class="['chat-modal-overlay', { 'standalone': !props.onClose }]">
    <div class="chat-modal">
      <header class="chat-header">
        <button class="close-btn" @click="onClose">×</button>
        <div class="user-header-info">
          <img 
            :src="userProfile?.photos && userProfile.photos.length > 0 ? userProfile.photos[0] : '/default-avatar.svg'" 
            class="avatar" 
            alt="Foto de perfil" 
            @click="goToUserProfile(effectiveUserId)" 
            style="cursor:pointer;" 
          />
          <div class="user-header-text">
            <div class="user-name-age">
              <span class="user-name">{{ userProfile?.name || 'Sin nombre' }}</span>
              <span v-if="userProfile?.age" class="user-age">, {{ userProfile.age }}</span>
            </div>
            <span class="city">{{ userProfile?.city || 'Sin ciudad' }}</span>
          </div>
        </div>
      </header>
      <div
        class="messages-container"
        ref="messagesContainer"
      >
        <button
          v-if="hasMore && !loadingMore"
          class="load-more-btn"
          @click="loadMessages(false)"
        >
          Cargar mensajes anteriores
        </button>
        <div v-if="loadingMore" class="loader loader-more">Cargando más...</div>
        <template v-if="messages.length > 0">
          <div v-for="msg in messages" :key="msg.id" :class="['message', msg.senderId === authStore.user?.id ? 'sent' : 'received']">
            <div class="msg-content">{{ msg.content }}</div>
            <div class="msg-meta">
              <span>{{ formatDate(msg.timestamp || msg.createdAt) }}</span>
            </div>
          </div>
        </template>
        <!-- Si no hay mensajes, no mostrar nada -->
      </div>
      <div class="input-row">
        <button class="emoji-btn" @click="showEmojiPicker = !showEmojiPicker" type="button">😊</button>
        <input v-model="input" @keyup.enter="send" placeholder="Escribe un mensaje..." />
        <button @click="send">Enviar</button>
        <div v-if="showEmojiPicker" class="emoji-picker-container">
          <EmojiPicker @select="onEmojiSelect" :native="true" :theme="'light'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { getMessagesPaginated, sendMessage, subscribeToMessages } from '@/services/messaging';
import { getProfileById } from '@/services/profiles';
import { useAuthStore } from '@/stores/auth';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications';

const props = defineProps<{
  matchId?: string;
  userId?: string;
  onClose?: () => void;
}>();

const authStore = useAuthStore();
const messages = ref<any[]>([]);
const lastDoc = ref<any>(null);
const loading = ref(true);
const loadingMore = ref(false);
const input = ref('');
const userProfile = ref<any>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const hasMore = ref(true);
let unsubscribe: (() => void) | null = null;
const showEmojiPicker = ref(false);
const router = useRouter();
const notificationsStore = useNotificationsStore();

// Obtener userId del query parameter si no viene como prop
const route = useRoute();
const effectiveUserId = props.userId || route.query.userId as string;
const effectiveMatchId = props.matchId || route.params.matchId as string;

const PAGE_SIZE = 20;

const formatDate = (date: any) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

const loadUserProfile = async () => {
  if (effectiveUserId) {
    userProfile.value = await getProfileById(effectiveUserId);
  }
};

const loadMessages = async (initial = false) => {
  // Validar que matchId no sea undefined
  if (!effectiveMatchId) {
    console.error('❌ Error: matchId es undefined/null en loadMessages');
    loading.value = false;
    loadingMore.value = false;
    return;
  }
  
  if ((initial && loading.value) || (!initial && loadingMore.value)) return;
  if (initial) {
    loading.value = true;
    messages.value = [];
    lastDoc.value = null;
    hasMore.value = true;
  } else {
    loadingMore.value = true;
  }
  
  console.log('📥 Cargando mensajes para matchId:', effectiveMatchId);
  
  // Guardar altura y scroll antes de cargar más mensajes
  let prevHeight = 0;
  if (!initial && messagesContainer.value) {
    prevHeight = messagesContainer.value.scrollHeight;
  }
  
  try {
    const { messages: msgs, lastDoc: last } = await getMessagesPaginated(effectiveMatchId, PAGE_SIZE, lastDoc.value);
    const orderedMsgs = msgs.slice().reverse();
    if (initial) {
      messages.value = orderedMsgs;
    } else {
      messages.value = [...orderedMsgs, ...messages.value];
    }
    lastDoc.value = last;
    if (!last || msgs.length < PAGE_SIZE) {
      hasMore.value = false;
    }
    
    console.log(`✅ Cargados ${orderedMsgs.length} mensajes para matchId: ${effectiveMatchId}`);
  } catch (error) {
    console.error('❌ Error cargando mensajes:', error);
  }
  
  loading.value = false;
  loadingMore.value = false;
  await nextTick();
  if (initial && messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
  // Ajustar scroll para mantener la posición relativa al cargar más mensajes
  if (!initial && messagesContainer.value) {
    const newHeight = messagesContainer.value.scrollHeight;
    messagesContainer.value.scrollTop = newHeight - prevHeight;
  }
};

const send = async () => {
  if (!input.value.trim()) return;
  
  // Validar que matchId no sea undefined o null
  if (!effectiveMatchId) {
    console.error('❌ Error: matchId es undefined/null al enviar mensaje');
    notificationsStore.error('Error', 'No se pudo enviar el mensaje. Inténtalo de nuevo.');
    return;
  }
  
  // Validar que el usuario esté autenticado
  if (!authStore.user?.id) {
    console.error('❌ Error: Usuario no autenticado al enviar mensaje');
    notificationsStore.error('Error', 'Debes estar autenticado para enviar mensajes.');
    return;
  }
  
  console.log('📤 Enviando mensaje:', { matchId: effectiveMatchId, senderId: authStore.user.id });
  
  // Optimista: agrega el mensaje localmente para feedback inmediato
  const tempMsg = {
    id: 'temp-' + Date.now(),
    matchId: effectiveMatchId,
    senderId: authStore.user.id,
    content: input.value,
    timestamp: new Date(),
    read: false
  };
  messages.value = [...messages.value, tempMsg];
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
  const msgText = input.value;
  input.value = '';
  
  try {
    await sendMessage(effectiveMatchId, authStore.user.id, msgText);
    console.log('✅ Mensaje enviado correctamente');
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    // Remover el mensaje temporal si falló
    messages.value = messages.value.filter(msg => msg.id !== tempMsg.id);
    notificationsStore.error('Error', 'Error al enviar el mensaje. Inténtalo de nuevo.');
  }
};

const onEmojiSelect = (emoji: any) => {
  input.value += emoji.i || emoji.emoji || emoji.native || '';
  showEmojiPicker.value = false;
};

const goToUserProfile = (userId: string) => {
  router.push(`/user/${userId}`);
};

const onClose = () => {
  if (props.onClose) {
    props.onClose();
  } else {
    // Si no hay onClose prop, navegar de vuelta
    router.back();
  }
};

onMounted(async () => {
  // Validar que matchId no sea undefined
  if (!effectiveMatchId) {
    console.error('❌ Error: matchId es undefined/null en onMounted de ChatView');
    return;
  }
  
  console.log('🚀 ChatView montado con matchId:', effectiveMatchId);
  
  await loadUserProfile();
  await loadMessages(true);
  
  // Solo suscribirse si matchId es válido
  if (effectiveMatchId) {
    unsubscribe = subscribeToMessages(effectiveMatchId, (msgs) => {
      // Solo mostrar los últimos PAGE_SIZE mensajes si no hay paginación activa
      if (!hasMore.value && msgs.length > PAGE_SIZE) {
        messages.value = msgs.slice(-PAGE_SIZE);
      } else {
        messages.value = msgs;
      }
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    });
  }
});

watch(() => effectiveMatchId, async (newMatchId) => {
  // Validar que el nuevo matchId no sea undefined
  if (!newMatchId) {
    console.error('❌ Error: Nuevo matchId es undefined/null en watcher');
    return;
  }
  
  console.log('🔄 MatchId cambiado a:', newMatchId);
  await loadUserProfile();
  await loadMessages(true);
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.chat-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.12); /* overlay más sutil */
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-modal-overlay.standalone {
  position: static;
  background: none;
  z-index: auto;
  display: block;
}
.chat-modal {
  background: var(--wa-bg);
  border-radius: var(--wa-radius);
  box-shadow: var(--wa-shadow);
  width: 98vw;
  max-width: 600px;
  min-width: 0;
  height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.chat-modal-overlay.standalone .chat-modal {
  width: 100%;
  max-width: 100%;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
}
@media (max-width: 700px) {
  .chat-modal {
    width: 98vw;
    max-width: 98vw;
    min-width: 0;
    height: 98vh;
    border-radius: 0;
  }
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: var(--wa-green);
  color: #fff;
  padding: 0.7rem 0.8rem;
  border-top-left-radius: var(--wa-radius);
  border-top-right-radius: var(--wa-radius);
  min-height: 44px;
  min-width: 0;
  overflow: hidden;
}
.close-btn {
  flex: 0 0 auto;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  margin-right: 0.3rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.user-header-info {
  display: flex;
  align-items: center;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}
.avatar {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--wa-green-light);
  background: #fff;
  margin-right: 0.3rem;
}
.user-header-text {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 1rem;
}
.user-name-age {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-name {
  font-weight: 700;
}
.user-age {
  font-weight: 400;
}
.city {
  font-size: 0.85rem;
  color: var(--wa-gray);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem 1.2rem 0.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--wa-bg);
}
.message {
  max-width: 80%;
  padding: 0.5rem 1rem;
  border-radius: 1.2rem;
  margin-bottom: 0.2rem;
  word-break: break-word;
  position: relative;
  font-size: 1rem;
}
.sent {
  align-self: flex-end;
  background: var(--wa-accent);
}
.received {
  align-self: flex-start;
  background: #fff;
}
.msg-meta {
  font-size: 0.7rem;
  color: #888;
  text-align: right;
}
.input-row {
  display: flex;
  align-items: center;
  padding: 0.7rem 0.5rem;
  background: #f7f7f7;
  border-top: 1px solid #ddd;
  position: relative;
  gap: 0.2rem;
}

.input-row input {
  flex: 1 1 0%;
  min-width: 60px;
  max-width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 2rem;
  border: 1px solid var(--wa-gray);
  font-size: 1rem;
  background: #fff;
  margin: 0 0.1rem;
  box-sizing: border-box;
  display: block;
  z-index: 10;
}

.input-row button {
  background: var(--wa-green);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 0.8rem;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 48px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0.3rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  max-width: 36px;
  min-width: 30px;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background-color: rgba(0,0,0,0.1);
}

@media (max-width: 700px) {
  .chat-header {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    padding: 0.4rem 0.4rem !important;
    min-height: 38px !important;
    min-width: 0 !important;
    overflow: hidden !important;
    gap: 0 !important;
    background: var(--wa-green) !important;
  }
  .close-btn {
    width: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    flex: 0 0 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 1.2rem !important;
    margin-right: 0.2rem !important;
    padding: 0 !important;
    border: none !important;
    background: none !important;
    color: #fff !important;
  }
  .user-header-info {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
    overflow: hidden !important;
    gap: 0.2rem !important;
    background: none !important;
    border: none !important;
  }
  .avatar {
    flex: 0 0 auto !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
    max-width: 28px !important;
    max-height: 28px !important;
    margin-right: 0.2rem !important;
    border-radius: 50% !important;
    object-fit: cover !important;
    border: 2px solid var(--wa-green-light) !important;
    background: #fff !important;
  }
  .user-header-text {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    font-size: 0.95rem !important;
    color: #fff !important;
    background: none !important;
    border: none !important;
  }
  .user-name-age {
    font-size: 0.95rem !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .city {
    font-size: 0.75rem !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
}

@media (max-width: 480px) {
  .input-row {
    padding: 0.5rem 0.5rem;
    gap: 0.1rem;
  }
  .input-row input {
    padding: 0.5rem 0.7rem;
    font-size: 0.95rem;
    min-width: 0;
    margin: 0 0.1rem;
  }
  .input-row button {
    padding: 0.5rem 0.6rem;
    font-size: 0.9rem;
    min-width: 34px;
    min-height: 34px;
  }
  .emoji-btn {
    font-size: 1.1rem;
    padding: 0.2rem;
    min-width: 30px;
    min-height: 30px;
  }
}
.loader {
  text-align: center;
  color: var(--wa-green);
  margin: 1rem 0;
}
.loader-more {
  font-size: 0.9rem;
}
.no-messages {
  text-align: center;
  color: #888;
  margin: 2rem 0;
}
.emoji-picker-container {
  position: absolute;
  bottom: 70px;
  left: 20px;
  z-index: 2000;
}
.load-more-btn {
  display: block;
  margin: 0 auto 0.7rem auto;
  padding: 0.4rem 1.2rem;
  background: rgba(255,255,255,0.35);
  color: var(--wa-green);
  border: 1px solid var(--wa-green-light);
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(2px);
}
.load-more-btn:hover {
  background: rgba(255,255,255,0.7);
  border: 1.5px solid var(--wa-green);
}
</style> 