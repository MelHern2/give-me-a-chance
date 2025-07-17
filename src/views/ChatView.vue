<template>
  <div class="chat-modal-overlay">
    <div class="chat-modal">
      <header class="chat-header">
        <button class="close-btn" @click="onClose">×</button>
        <div class="user-header-info">
          <img v-if="userProfile?.photos && userProfile.photos.length > 0" :src="userProfile.photos[0]" class="avatar" alt="Foto de perfil" />
          <div class="user-header-text">
            <div class="user-name-age">
              <span class="user-name">{{ userProfile?.name }}</span>
              <span v-if="userProfile?.age" class="user-age">, {{ userProfile.age }}</span>
            </div>
            <span class="city">{{ userProfile?.city }}</span>
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

const props = defineProps<{
  matchId: string;
  userId: string;
  onClose: () => void;
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

const PAGE_SIZE = 20;

const formatDate = (date: any) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

const loadUserProfile = async () => {
  if (props.userId) {
    userProfile.value = await getProfileById(props.userId);
  }
};

const loadMessages = async (initial = false) => {
  if ((initial && loading.value) || (!initial && loadingMore.value)) return;
  if (initial) {
    loading.value = true;
    messages.value = [];
    lastDoc.value = null;
    hasMore.value = true;
  } else {
    loadingMore.value = true;
  }
  // Guardar altura y scroll antes de cargar más mensajes
  let prevHeight = 0;
  if (!initial && messagesContainer.value) {
    prevHeight = messagesContainer.value.scrollHeight;
  }
  const { messages: msgs, lastDoc: last } = await getMessagesPaginated(props.matchId, PAGE_SIZE, lastDoc.value);
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
  // Optimista: agrega el mensaje localmente para feedback inmediato
  const tempMsg = {
    id: 'temp-' + Date.now(),
    matchId: props.matchId,
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
  await sendMessage(props.matchId, authStore.user.id, msgText);
};

const onEmojiSelect = (emoji: any) => {
  input.value += emoji.i || emoji.emoji || emoji.native || '';
  showEmojiPicker.value = false;
};

onMounted(async () => {
  await loadUserProfile();
  await loadMessages(true);
  unsubscribe = subscribeToMessages(props.matchId, (msgs) => {
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
});

watch(() => props.matchId, async () => {
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
  background: var(--wa-green);
  color: #fff;
  padding: 1rem 1.5rem;
  border-top-left-radius: var(--wa-radius);
  border-top-right-radius: var(--wa-radius);
  gap: 1rem;
}
.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  margin-right: 1rem;
  cursor: pointer;
}
.user-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--wa-green-light);
  background: #fff;
}
.user-header-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.user-name-age {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}
.user-name {
  font-weight: 700;
}
.user-age {
  font-weight: 400;
}
.city {
  font-size: 0.95rem;
  color: var(--wa-gray);
  font-weight: 400;
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
  padding: 1rem 1.2rem;
  background: #f7f7f7;
  border-top: 1px solid #ddd;
  position: relative;
  gap: 0.5rem;
}
.input-row input {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  border: 1px solid var(--wa-gray);
  margin-right: 0.5rem;
  font-size: 1rem;
}
.input-row button {
  background: var(--wa-green);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
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
.emoji-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  margin-right: 0.5rem;
  cursor: pointer;
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