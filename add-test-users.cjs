// Script para agregar usuarios de prueba en España
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

const testUsers = [
  {
    name: 'Ana García',
    age: 28,
    gender: 'female',
    country: 'Spain',
    region: 'Madrid',
    city: 'Madrid',
    religion: 'catolica',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'centro',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Me encanta viajar, leer y conocer gente nueva. Busco una relación seria y estable.',
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    ],
    createdAt: new Date('2024-01-15'),
    email: 'ana.garcia@test.com'
  },
  {
    name: 'Carlos Rodríguez',
    age: 32,
    gender: 'male',
    country: 'Spain',
    region: 'Barcelona',
    city: 'Barcelona',
    religion: 'ateo',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'izquierda',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Ingeniero de software, amante del fútbol y la música. Busco alguien con quien compartir la vida.',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    ],
    createdAt: new Date('2024-01-20'),
    email: 'carlos.rodriguez@test.com'
  },
  {
    name: 'María López',
    age: 25,
    gender: 'female',
    country: 'Spain',
    region: 'Valencia',
    city: 'Valencia',
    religion: 'catolica',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'centro-derecha',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Profesora de inglés, me gusta el arte, la cocina y los viajes. Busco una relación seria.',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
    ],
    createdAt: new Date('2024-02-01'),
    email: 'maria.lopez@test.com'
  },
  {
    name: 'David Martín',
    age: 30,
    gender: 'male',
    country: 'Spain',
    region: 'Sevilla',
    city: 'Sevilla',
    religion: 'ateo',
    isMonogamous: false,
    sexualOrientation: 'bisexual',
    politicalOrientation: 'centro',
    hasChildren: false,
    relationshipType: 'casual',
    description: 'Músico y DJ, me encanta la vida nocturna y conocer gente interesante.',
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    ],
    createdAt: new Date('2024-02-10'),
    email: 'david.martin@test.com'
  },
  {
    name: 'Laura Fernández',
    age: 27,
    gender: 'female',
    country: 'Spain',
    region: 'Bilbao',
    city: 'Bilbao',
    religion: 'ateo',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'izquierda',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Arquitecta, amante del diseño y la naturaleza. Busco alguien con valores similares.',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'
    ],
    createdAt: new Date('2024-02-15'),
    email: 'laura.fernandez@test.com'
  },
  {
    name: 'Javier Moreno',
    age: 35,
    gender: 'male',
    country: 'Spain',
    region: 'Madrid',
    city: 'Madrid',
    religion: 'catolica',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'derecha',
    hasChildren: true,
    relationshipType: 'seria',
    description: 'Médico, padre de una niña de 5 años. Busco una relación seria y estable.',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
    ],
    createdAt: new Date('2024-01-25'),
    email: 'javier.moreno@test.com'
  },
  {
    name: 'Sofia Torres',
    age: 24,
    gender: 'female',
    country: 'Spain',
    region: 'Málaga',
    city: 'Málaga',
    religion: 'catolica',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'centro',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Estudiante de medicina, me gusta el deporte y la lectura. Busco una relación seria.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    ],
    createdAt: new Date('2024-03-01'),
    email: 'sofia.torres@test.com'
  },
  {
    name: 'Miguel Sánchez',
    age: 29,
    gender: 'male',
    country: 'Spain',
    region: 'Zaragoza',
    city: 'Zaragoza',
    religion: 'ateo',
    isMonogamous: false,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'centro-izquierda',
    hasChildren: false,
    relationshipType: 'casual',
    description: 'Chef, me apasiona la cocina y los viajes. Busco conocer gente interesante.',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    ],
    createdAt: new Date('2024-02-20'),
    email: 'miguel.sanchez@test.com'
  },
  {
    name: 'Carmen Ruiz',
    age: 31,
    gender: 'female',
    country: 'Spain',
    region: 'Granada',
    city: 'Granada',
    religion: 'musulmana',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'centro',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Profesora de historia, me encanta la cultura árabe y el flamenco. Busco una relación seria.',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
    ],
    createdAt: new Date('2024-01-30'),
    email: 'carmen.ruiz@test.com'
  },
  {
    name: 'Roberto Jiménez',
    age: 33,
    gender: 'male',
    country: 'Spain',
    region: 'Alicante',
    city: 'Alicante',
    religion: 'ateo',
    isMonogamous: true,
    sexualOrientation: 'heterosexual',
    politicalOrientation: 'centro-derecha',
    hasChildren: false,
    relationshipType: 'seria',
    description: 'Abogado, amante del mar y los deportes acuáticos. Busco una relación seria y estable.',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    ],
    createdAt: new Date('2024-02-05'),
    email: 'roberto.jimenez@test.com'
  }
];

const addTestUsers = async () => {
  try {
    console.log('Agregando usuarios de prueba...');
    
    for (const user of testUsers) {
      const userData = {
        ...user,
        id: user.email, // Usar email como ID para simplicidad
        createdAt: user.createdAt,
        updatedAt: new Date(),
        isAdmin: false,
        isBanned: false
      };
      
      await addDoc(collection(db, 'users'), userData);
      console.log(`✅ Usuario agregado: ${user.name}`);
    }
    
    console.log('🎉 Todos los usuarios de prueba han sido agregados exitosamente');
  } catch (error) {
    console.error('❌ Error agregando usuarios de prueba:', error);
  }
};

// Ejecutar el script
addTestUsers(); 