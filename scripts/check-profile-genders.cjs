const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkProfileGenders() {
  try {
    console.log('👥 Verificando géneros de los perfiles...');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(20));
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Encontrados ${querySnapshot.size} usuarios`);
    
    const genderCounts = {};
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const userName = userData.name || userData.displayName || 'Usuario';
      const gender = userData.gender || 'sin género';
      
      console.log(`👤 ${userName}: género = "${gender}"`);
      
      if (genderCounts[gender]) {
        genderCounts[gender]++;
      } else {
        genderCounts[gender] = 1;
      }
    });
    
    console.log(`\n📊 Resumen de géneros:`);
    Object.keys(genderCounts).forEach(gender => {
      console.log(`"${gender}": ${genderCounts[gender]} perfiles`);
    });
    
    console.log(`\n🎯 Opciones de género en la app:`);
    console.log(`- "masculino"`);
    console.log(`- "femenino"`);
    console.log(`- "no-binario"`);
    console.log(`- "otro"`);
    console.log(`- "prefiero-no-decirlo"`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProfileGenders(); 