// Script para probar la eliminación de interacciones al deshacer un match
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

console.log('🧪 Probando eliminación de interacciones...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUnmatchInteractions() {
  try {
    console.log('🔍 Obteniendo todos los matches...');
    
    const matchesRef = collection(db, 'matches');
    const matchesSnapshot = await getDocs(matchesRef);
    
    console.log(`📊 Total de matches: ${matchesSnapshot.size}`);
    
    if (matchesSnapshot.empty) {
      console.log('❌ No hay matches para probar');
      return;
    }
    
    // Tomar el primer match para la prueba
    const firstMatch = matchesSnapshot.docs[0];
    const matchData = firstMatch.data();
    const matchId = firstMatch.id;
    const users = matchData.users || [];
    
    console.log('🎯 Probando con match:', matchId);
    console.log('👥 Usuarios en el match:', users);
    
    if (users.length < 2) {
      console.log('❌ Match no tiene 2 usuarios, saltando...');
      return;
    }
    
    const [userA, userB] = users;
    
    // Verificar likes antes
    console.log('\n🔍 Verificando likes antes de eliminar...');
    const likesRef = collection(db, 'likes');
    const likesQuery = query(
      likesRef,
      where('fromUserId', 'in', [userA, userB])
    );
    const likesSnapshot = await getDocs(likesQuery);
    
    console.log(`📊 Likes encontrados: ${likesSnapshot.size}`);
    likesSnapshot.forEach(doc => {
      const likeData = doc.data();
      console.log(`  - ${likeData.fromUserId} → ${likeData.toUserId}`);
    });
    
    // Verificar dislikes antes
    console.log('\n🔍 Verificando dislikes antes de eliminar...');
    const dislikesRef = collection(db, 'dislikes');
    const dislikesQuery = query(
      dislikesRef,
      where('fromUserId', 'in', [userA, userB])
    );
    const dislikesSnapshot = await getDocs(dislikesQuery);
    
    console.log(`📊 Dislikes encontrados: ${dislikesSnapshot.size}`);
    dislikesSnapshot.forEach(doc => {
      const dislikeData = doc.data();
      console.log(`  - ${dislikeData.fromUserId} → ${dislikeData.toUserId}`);
    });
    
    console.log('\n✅ Prueba completada. Los datos están listos para ser eliminados.');
    console.log('💡 Para probar la eliminación real, usa la función deleteMatch() desde la aplicación.');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar el script
testUnmatchInteractions().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 