// Script para verificar los géneros de los perfiles
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

console.log('🚀 Verificando géneros de perfiles...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkProfileGenders() {
  try {
    console.log('🔍 Obteniendo todos los perfiles...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Total de perfiles: ${snapshot.size}`);
    
    const genderCounts = {};
    const profilesWithGender = [];
    const profilesWithoutGender = [];
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      const gender = userData.gender;
      
      if (gender) {
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        profilesWithGender.push({
          id: doc.id,
          name: userData.name,
          gender: gender
        });
      } else {
        profilesWithoutGender.push({
          id: doc.id,
          name: userData.name,
          gender: 'NO ESPECIFICADO'
        });
      }
    });
    
    console.log('\n📈 Estadísticas de géneros:');
    Object.entries(genderCounts).forEach(([gender, count]) => {
      console.log(`  ${gender}: ${count} perfiles`);
    });
    
    console.log(`\n✅ Perfiles CON género: ${profilesWithGender.length}`);
    console.log(`❌ Perfiles SIN género: ${profilesWithoutGender.length}`);
    
    if (profilesWithGender.length > 0) {
      console.log('\n👥 Ejemplos de perfiles con género:');
      profilesWithGender.slice(0, 5).forEach(profile => {
        console.log(`  - ${profile.name}: ${profile.gender}`);
      });
    }
    
    if (profilesWithoutGender.length > 0) {
      console.log('\n⚠️  Ejemplos de perfiles sin género:');
      profilesWithoutGender.slice(0, 5).forEach(profile => {
        console.log(`  - ${profile.name}: ${profile.gender}`);
      });
    }
    
    // Verificar si los géneros coinciden con las opciones del filtro
    const filterOptions = ['masculino', 'femenino', 'no-binario', 'otro', 'prefiero-no-decirlo'];
    console.log('\n🔍 Verificando coincidencia con opciones de filtro:');
    filterOptions.forEach(option => {
      const count = genderCounts[option] || 0;
      console.log(`  "${option}": ${count} perfiles`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando géneros:', error);
  }
}

// Ejecutar el script
checkProfileGenders().then(() => {
  console.log('🏁 Verificación completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 