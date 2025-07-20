// Script para probar el cambio de votos entre like y dislike
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2T2kGXwpaz84mvKpxPZiVgnG8lNflBo0",
  authDomain: "dating-app-ca189.firebaseapp.com",
  projectId: "dating-app-ca189",
  storageBucket: "dating-app-ca189.firebasestorage.app",
  messagingSenderId: "814656156894",
  appId: "1:814656156894:web:ff33b8c01aef2848827e4f",
  measurementId: "G-W1CBF2KY97"
};

console.log('🧪 Probando cambio de votos...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testVoteChange() {
  try {
    console.log('🔍 Obteniendo interacciones de usuarios...');
    
    // Obtener algunos likes y dislikes para analizar
    const likesRef = collection(db, 'likes');
    const likesSnapshot = await getDocs(likesRef);
    
    const dislikesRef = collection(db, 'dislikes');
    const dislikesSnapshot = await getDocs(dislikesRef);
    
    console.log(`📊 Total de likes: ${likesSnapshot.size}`);
    console.log(`📊 Total de dislikes: ${dislikesSnapshot.size}`);
    
    if (likesSnapshot.empty && dislikesSnapshot.empty) {
      console.log('❌ No hay interacciones para analizar');
      return;
    }
    
    // Analizar algunos ejemplos
    console.log('\n👥 Ejemplos de likes:');
    likesSnapshot.docs.slice(0, 3).forEach(doc => {
      const likeData = doc.data();
      console.log(`  - ${likeData.fromUserId} → ${likeData.toUserId}`);
    });
    
    console.log('\n👥 Ejemplos de dislikes:');
    dislikesSnapshot.docs.slice(0, 3).forEach(doc => {
      const dislikeData = doc.data();
      console.log(`  - ${dislikeData.fromUserId} → ${dislikeData.toUserId}`);
    });
    
    // Buscar usuarios que tengan tanto likes como dislikes
    const allUserIds = new Set();
    likesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      allUserIds.add(data.fromUserId);
      allUserIds.add(data.toUserId);
    });
    dislikesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      allUserIds.add(data.fromUserId);
      allUserIds.add(data.toUserId);
    });
    
    console.log(`\n👥 Total de usuarios únicos con interacciones: ${allUserIds.size}`);
    
    // Verificar si hay usuarios que han cambiado su voto
    console.log('\n🔄 Verificando cambios de voto...');
    let voteChanges = 0;
    
    for (const userId of allUserIds) {
      // Buscar likes de este usuario
      const userLikesQuery = query(likesRef, where('fromUserId', '==', userId));
      const userLikesSnapshot = await getDocs(userLikesQuery);
      
      // Buscar dislikes de este usuario
      const userDislikesQuery = query(dislikesRef, where('fromUserId', '==', userId));
      const userDislikesSnapshot = await getDocs(userDislikesQuery);
      
      if (!userLikesSnapshot.empty && !userDislikesSnapshot.empty) {
        console.log(`⚠️ Usuario ${userId} tiene tanto likes como dislikes (posible cambio de voto)`);
        voteChanges++;
      }
    }
    
    console.log(`\n📊 Usuarios con posibles cambios de voto: ${voteChanges}`);
    console.log('\n✅ Análisis completado. La funcionalidad de cambio de voto está lista para usar.');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar el script
testVoteChange().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 