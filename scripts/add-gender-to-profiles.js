// Script para agregar géneros a perfiles que no los tienen
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

console.log('🚀 Agregando géneros a perfiles...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addGenderToProfiles() {
  try {
    console.log('🔍 Obteniendo todos los perfiles...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Total de perfiles: ${snapshot.size}`);
    
    const profilesWithoutGender = [];
    const profilesWithGender = [];
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      const gender = userData.gender;
      
      if (gender) {
        profilesWithGender.push({
          id: doc.id,
          name: userData.name,
          gender: gender
        });
      } else {
        profilesWithoutGender.push({
          id: doc.id,
          name: userData.name,
          email: userData.email
        });
      }
    });
    
    console.log(`✅ Perfiles CON género: ${profilesWithGender.length}`);
    console.log(`❌ Perfiles SIN género: ${profilesWithoutGender.length}`);
    
    if (profilesWithoutGender.length === 0) {
      console.log('🎉 Todos los perfiles ya tienen género especificado');
      return;
    }
    
    console.log('\n👥 Perfiles sin género:');
    profilesWithoutGender.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.email})`);
    });
    
    // Opciones de género disponibles
    const genderOptions = ['masculino', 'femenino', 'no-binario', 'otro', 'prefiero-no-decirlo'];
    
    console.log('\n🔄 Agregando géneros por defecto...');
    
    for (const profile of profilesWithoutGender) {
      // Asignar género basado en el nombre o email (simulación)
      let assignedGender = 'prefiero-no-decirlo'; // Por defecto
      
      // Lógica simple para asignar género basado en el nombre
      const name = profile.name?.toLowerCase() || '';
      const email = profile.email?.toLowerCase() || '';
      
      if (name.includes('maria') || name.includes('ana') || name.includes('lucia') || 
          email.includes('maria') || email.includes('ana') || email.includes('lucia')) {
        assignedGender = 'femenino';
      } else if (name.includes('juan') || name.includes('carlos') || name.includes('pedro') ||
                 email.includes('juan') || email.includes('carlos') || email.includes('pedro')) {
        assignedGender = 'masculino';
      } else {
        // Asignar aleatoriamente entre masculino y femenino
        assignedGender = Math.random() > 0.5 ? 'masculino' : 'femenino';
      }
      
      try {
        const userRef = doc(db, 'users', profile.id);
        await updateDoc(userRef, {
          gender: assignedGender,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${profile.name}: asignado género "${assignedGender}"`);
      } catch (error) {
        console.error(`❌ Error actualizando ${profile.name}:`, error);
      }
    }
    
    console.log('\n🎉 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error agregando géneros:', error);
  }
}

// Ejecutar el script
addGenderToProfiles().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 