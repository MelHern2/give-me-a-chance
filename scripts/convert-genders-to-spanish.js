// Script para convertir géneros de inglés a español
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

console.log('🚀 Convirtiendo géneros a español...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function convertGendersToSpanish() {
  try {
    console.log('🔍 Obteniendo todos los perfiles...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Total de perfiles: ${snapshot.size}`);
    
    const profilesToUpdate = [];
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      const gender = userData.gender;
      
      if (gender === 'male' || gender === 'female') {
        profilesToUpdate.push({
          id: doc.id,
          name: userData.name,
          currentGender: gender,
          newGender: gender === 'male' ? 'masculino' : 'femenino'
        });
      }
    });
    
    console.log(`🔄 Perfiles a actualizar: ${profilesToUpdate.length}`);
    
    if (profilesToUpdate.length === 0) {
      console.log('🎉 No hay perfiles que necesiten conversión');
      return;
    }
    
    console.log('\n👥 Perfiles a convertir:');
    profilesToUpdate.forEach(profile => {
      console.log(`  - ${profile.name}: ${profile.currentGender} → ${profile.newGender}`);
    });
    
    console.log('\n🔄 Actualizando géneros...');
    
    for (const profile of profilesToUpdate) {
      try {
        const userRef = doc(db, 'users', profile.id);
        await updateDoc(userRef, {
          gender: profile.newGender,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${profile.name}: ${profile.currentGender} → ${profile.newGender}`);
      } catch (error) {
        console.error(`❌ Error actualizando ${profile.name}:`, error);
      }
    }
    
    console.log('\n🎉 Conversión completada');
    
  } catch (error) {
    console.error('❌ Error convirtiendo géneros:', error);
  }
}

// Ejecutar el script
convertGendersToSpanish().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 