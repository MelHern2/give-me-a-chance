import { db } from '@/config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  startAfter,
  limit,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { usePendingMatchesStore } from '@/stores/pendingMatches';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: any;
  read: boolean;
}

export interface Chat {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

// Enviar un mensaje
export const sendMessage = async (matchId: string, senderId: string, content: string): Promise<void> => {
  // Validar parámetros antes de enviar
  if (!matchId || !senderId || !content) {
    console.error('❌ Error: Parámetros inválidos para sendMessage:', { matchId, senderId, content });
    throw new Error('Parámetros inválidos para enviar mensaje');
  }
  
  try {
    console.log('📤 Enviando mensaje a Firestore:', { matchId, senderId, content: content.substring(0, 50) + '...' });
    
    const messageData = {
      matchId,
      senderId,
      content,
      timestamp: serverTimestamp(),
      read: false
    };

    await addDoc(collection(db, 'messages'), messageData);

    // Verificar si es el primer mensaje del match (para actualizar matches pendientes)
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    const isFirstMessage = matchSnap.exists() && !matchSnap.data().hasMessages;

    // Actualizar el match con hasMessages = true si es el primer mensaje
    if (isFirstMessage) {
      await updateDoc(matchRef, {
        hasMessages: true,
        lastMessage: content,
        lastMessageAt: serverTimestamp()
      });
      console.log('✅ Primer mensaje enviado, match actualizado como activo');
      
      // Actualizar el store de matches pendientes
      try {
        const pendingMatchesStore = usePendingMatchesStore();
        pendingMatchesStore.markMatchAsActive(matchId);
      } catch (error) {
        console.error('Error actualizando store de matches pendientes:', error);
      }
      
      // Emitir evento para que otros componentes sepan que se envió el primer mensaje
      window.dispatchEvent(new CustomEvent('first-message-sent', { 
        detail: { matchId } 
      }));
    }

    // Actualizar el chat con el último mensaje
    const chatRef = doc(db, 'chats', matchId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      // Obtener participantes del match (buscamos en matches)
      let participants = [];
      if (matchSnap.exists()) {
        const matchData = matchSnap.data();
        participants = matchData.users || [];
      } else {
        // fallback: solo el sender
        participants = [senderId];
      }
      await setDoc(chatRef, {
        matchId,
        participants,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: 0,
        lastMessage: messageData
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: messageData,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Obtener mensajes de un match
export const getMessages = async (matchId: string): Promise<Message[]> => {
  // Validar matchId
  if (!matchId) {
    console.error('❌ Error: matchId es undefined/null en getMessages');
    return [];
  }
  
  try {
    console.log('📥 Obteniendo mensajes para matchId:', matchId);
    const messagesQuery = query(
      collection(db, 'messages'),
      where('matchId', '==', matchId),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    
    console.log(`✅ Obtenidos ${messages.length} mensajes para matchId: ${matchId}`);
    return messages;

  } catch (error) {
    console.error('❌ Error getting messages:', error);
    return [];
  }
};

// Suscribirse a mensajes en tiempo real
export const subscribeToMessages = (matchId: string, callback: (messages: Message[]) => void) => {
  // Validar matchId
  if (!matchId) {
    console.error('❌ Error: matchId es undefined/null en subscribeToMessages');
    return () => {}; // Retornar función vacía para evitar errores
  }
  
  console.log('👂 Suscribiéndose a mensajes para matchId:', matchId);
  
  const messagesQuery = query(
    collection(db, 'messages'),
    where('matchId', '==', matchId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    
    console.log(`📨 Mensajes actualizados para matchId ${matchId}: ${messages.length} mensajes`);
    callback(messages);
  }, (error) => {
    console.error('❌ Error en suscripción de mensajes:', error);
  });
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (matchId: string, userId: string): Promise<void> => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('matchId', '==', matchId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(messagesQuery);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);

  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Obtener chats de un usuario
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(chatsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Chat[];

  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
};

// Crear un nuevo chat cuando se hace match
export const createChat = async (matchId: string, participants: string[]): Promise<void> => {
  try {
    const chatData = {
      matchId,
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      unreadCount: 0
    };

    await addDoc(collection(db, 'chats'), chatData);

  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Obtener conteo de mensajes no leídos
export const getUnreadCount = async (matchId: string, userId: string): Promise<number> => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('matchId', '==', matchId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(messagesQuery);
    return snapshot.size;

  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Eliminar un mensaje (solo para el remitente)
export const deleteMessage = async (messageId: string, senderId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDocs(query(
      collection(db, 'messages'),
      where('__name__', '==', messageId),
      where('senderId', '==', senderId)
    ));

    if (!messageDoc.empty) {
      await updateDoc(messageRef, { deleted: true });
    }

  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}; 

// Obtener mensajes paginados de un match
export const getMessagesPaginated = async (
  matchId: string,
  pageSize: number = 20,
  startAfterDoc: any = null
): Promise<{ messages: Message[]; lastDoc: any }> => {
  try {
    let messagesQuery = query(
      collection(db, 'messages'),
      where('matchId', '==', matchId),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );
    if (startAfterDoc) {
      messagesQuery = query(
        collection(db, 'messages'),
        where('matchId', '==', matchId),
        orderBy('timestamp', 'desc'),
        startAfter(startAfterDoc),
        limit(pageSize)
      );
    }
    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    return { messages, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
  } catch (error) {
    console.error('Error getting paginated messages:', error);
    return { messages: [], lastDoc: null };
  }
}; 