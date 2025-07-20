const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Configuración de Firebase (ajusta según tu configuración)
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkProfilesLocation() {
  try {
    console.log('🔍 Verificando perfiles y ubicaciones...');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(10));
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Encontrados ${querySnapshot.size} usuarios`);
    
    let profilesWithLocation = 0;
    let profilesWithoutLocation = 0;
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 Usuario: ${userData.name}`);
      console.log(`📍 Ubicación:`, userData.location);
      
      if (userData.location && userData.location.latitude && userData.location.longitude) {
        profilesWithLocation++;
        console.log(`✅ Tiene ubicación válida`);
      } else {
        profilesWithoutLocation++;
        console.log(`❌ Sin ubicación válida`);
      }
      console.log('---');
    });
    
    console.log(`📊 Resumen:`);
    console.log(`✅ Perfiles con ubicación: ${profilesWithLocation}`);
    console.log(`❌ Perfiles sin ubicación: ${profilesWithoutLocation}`);
    console.log(`📊 Total: ${querySnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProfilesLocation(); 