const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq",
  authDomain: "dating-app-ca189.firebaseapp.com",
  projectId: "dating-app-ca189",
  storageBucket: "dating-app-ca189.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetAllInteractions() {
  console.log('🔄 Iniciando reinicio de todas las interacciones...');
  
  try {
    // 1. Eliminar todos los likes
    console.log('🗑️ Eliminando likes...');
    const likesSnapshot = await getDocs(collection(db, 'likes'));
    const likesBatch = writeBatch(db);
    likesSnapshot.forEach((doc) => {
      likesBatch.delete(doc.ref);
    });
    await likesBatch.commit();
    console.log(`✅ Eliminados ${likesSnapshot.size} likes`);

    // 2. Eliminar todos los dislikes
    console.log('🗑️ Eliminando dislikes...');
    const dislikesSnapshot = await getDocs(collection(db, 'dislikes'));
    const dislikesBatch = writeBatch(db);
    dislikesSnapshot.forEach((doc) => {
      dislikesBatch.delete(doc.ref);
    });
    await dislikesBatch.commit();
    console.log(`✅ Eliminados ${dislikesSnapshot.size} dislikes`);

    // 3. Eliminar todos los matches
    console.log('🗑️ Eliminando matches...');
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    const matchesBatch = writeBatch(db);
    matchesSnapshot.forEach((doc) => {
      matchesBatch.delete(doc.ref);
    });
    await matchesBatch.commit();
    console.log(`✅ Eliminados ${matchesSnapshot.size} matches`);

    // 4. Eliminar todos los mensajes
    console.log('🗑️ Eliminando mensajes...');
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    const messagesBatch = writeBatch(db);
    messagesSnapshot.forEach((doc) => {
      messagesBatch.delete(doc.ref);
    });
    await messagesBatch.commit();
    console.log(`✅ Eliminados ${messagesSnapshot.size} mensajes`);

    // 5. Eliminar todos los chats
    console.log('🗑️ Eliminando chats...');
    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    const chatsBatch = writeBatch(db);
    chatsSnapshot.forEach((doc) => {
      chatsBatch.delete(doc.ref);
    });
    await chatsBatch.commit();
    console.log(`✅ Eliminados ${chatsSnapshot.size} chats`);

    console.log('🎉 ¡Reinicio completado! Todas las interacciones han sido eliminadas.');
    console.log('📊 Resumen:');
    console.log(`   - Likes eliminados: ${likesSnapshot.size}`);
    console.log(`   - Dislikes eliminados: ${dislikesSnapshot.size}`);
    console.log(`   - Matches eliminados: ${matchesSnapshot.size}`);
    console.log(`   - Mensajes eliminados: ${messagesSnapshot.size}`);
    console.log(`   - Chats eliminados: ${chatsSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error durante el reinicio:', error);
  }
}

// Ejecutar el script
resetAllInteractions().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error en el script:', error);
  process.exit(1);
}); 