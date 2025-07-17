<template>
  <div class="user-profile-view">
    <div v-if="loading" class="loading">
      Cargando perfil...
    </div>
    
    <div v-else-if="profile" class="profile-container">
      <!-- Header con botón de regreso -->
      <header class="profile-header">
        <button @click="$router.go(-1)" class="back-btn">
          ← Volver
        </button>
        <h1>{{ profile.name }}, {{ profile.age }}</h1>
      </header>

      <!-- Contenido principal -->
      <div class="main-content">
        <!-- Galería de fotos con botones superpuestos -->
        <div class="photo-gallery">
          <div v-if="profile.photos && profile.photos.length > 0" class="main-photo">
            <img :src="profile.photos[currentPhotoIndex]" :alt="profile.name" />
            
            <!-- Botones de acción superpuestos -->
            <div class="overlay-buttons">
              <button @click="handleDislike" class="action-btn dislike">
                <span class="icon">👎</span>
              </button>
              <button @click="handleLike" class="action-btn like">
                <span class="icon">👍</span>
              </button>
            </div>

            <!-- Navegación de fotos con botones laterales -->
            <div v-if="profile.photos.length > 1" class="photo-nav">
              <button 
                @click="previousPhoto" 
                class="nav-btn prev"
                :disabled="currentPhotoIndex === 0"
              >
                ‹
              </button>
              <button 
                @click="nextPhoto" 
                class="nav-btn next"
                :disabled="currentPhotoIndex === profile.photos.length - 1"
              >
                ›
              </button>
            </div>
            
            <!-- Indicadores de fotos -->
            <div v-if="profile.photos.length > 1" class="photo-indicators">
              <span 
                v-for="(photo, index) in profile.photos" 
                :key="index"
                :class="['indicator', { active: index === currentPhotoIndex }]"
                @click="currentPhotoIndex = index"
              ></span>
            </div>
          </div>
          <div v-else class="no-photo">
            <span>Sin fotos</span>
          </div>
        </div>

        <!-- Información del perfil -->
        <div class="profile-info">
          <div class="location">
            <p>{{ profile.city }}, {{ profile.region }}, {{ profile.country }}</p>
          </div>

          <div class="description">
            <h3>Sobre mí</h3>
            <p>{{ profile.description }}</p>
          </div>

          <div class="details">
            <h3>Detalles</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Orientación sexual:</span>
                <span class="value">{{ getSexualOrientationLabel(profile.sexualOrientation) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Tipo de relación:</span>
                <span class="value">{{ getRelationshipTypeLabel(profile.relationshipType) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Religión:</span>
                <span class="value">{{ getReligionLabel(profile.religion) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Orientación política:</span>
                <span class="value">{{ getPoliticalOrientationLabel(profile.politicalOrientation) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Monógamo:</span>
                <span class="value">{{ profile.isMonogamous ? 'Sí' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Tiene hijos:</span>
                <span class="value">{{ profile.hasChildren ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="tags">
            <span class="tag">{{ getSexualOrientationLabel(profile.sexualOrientation) }}</span>
            <span class="tag">{{ getRelationshipTypeLabel(profile.relationshipType) }}</span>
            <span v-if="profile.hasChildren" class="tag">Con hijos</span>
            <span v-if="profile.isMonogamous" class="tag">Monógamo</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error">
      <p>Perfil no encontrado</p>
      <button @click="$router.go(-1)" class="back-btn">Volver</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getProfileById } from '@/services/profiles';
import { giveLike } from '@/services/likes';
import type { UserProfile } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const currentPhotoIndex = ref(0);

const getSexualOrientationLabel = (orientation: string) => {
  const labels = {
    heterosexual: 'Heterosexual',
    homosexual: 'Homosexual',
    bisexual: 'Bisexual',
    pansexual: 'Pansexual',
    asexual: 'Asexual'
  };
  return labels[orientation as keyof typeof labels] || orientation;
};

const getRelationshipTypeLabel = (type: string) => {
  const labels = {
    seria: 'Relación seria',
    casual: 'Relación casual',
    amistad: 'Amistad',
    matrimonio: 'Matrimonio',
    poliamor: 'Poliamor'
  };
  return labels[type as keyof typeof labels] || type;
};

const getReligionLabel = (religion: string) => {
  const labels = {
    catolica: 'Católica',
    protestante: 'Protestante',
    musulmana: 'Musulmana',
    judia: 'Judía',
    budista: 'Budista',
    hindu: 'Hindú',
    ateo: 'Ateo/Agnóstico',
    otro: 'Otro'
  };
  return labels[religion as keyof typeof labels] || religion;
};

const getPoliticalOrientationLabel = (orientation: string) => {
  const labels = {
    izquierda: 'Izquierda',
    'centro-izquierda': 'Centro-izquierda',
    centro: 'Centro',
    'centro-derecha': 'Centro-derecha',
    derecha: 'Derecha',
    apolitico: 'Apolítico'
  };
  return labels[orientation as keyof typeof labels] || orientation;
};

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
  }
};

const nextPhoto = () => {
  if (profile.value && currentPhotoIndex.value < profile.value.photos.length - 1) {
    currentPhotoIndex.value++;
  }
};

const handleLike = async () => {
  if (!profile.value || !authStore.user) return;
  
  try {
    console.log('Dando like a:', profile.value.name);
    const result = await giveLike(authStore.user.id, profile.value.id);
    
    if (result.isMatch) {
      console.log('¡Match! ID:', result.matchId);
      // Mostrar notificación de match
      alert(`¡Match con ${profile.value.name}!`);
    } else {
      console.log('Like enviado, esperando respuesta');
    }
    
    router.go(-1); // Volver a la lista de perfiles
  } catch (error) {
    console.error('Error al dar like:', error);
    alert('Error al enviar el like');
  }
};

const handleDislike = async () => {
  if (!profile.value || !authStore.user) return;
  
  try {
    console.log('Dislike a:', profile.value.name);
    // TODO: Implementar servicio de dislikes si es necesario
    router.go(-1); // Volver a la lista de perfiles
  } catch (error) {
    console.error('Error al dar dislike:', error);
  }
};

const loadProfile = async () => {
  const profileId = route.params.id as string;
  
  if (!profileId) {
    loading.value = false;
    return;
  }

  try {
    const profileData = await getProfileById(profileId);
    profile.value = profileData;
  } catch (error) {
    console.error('Error cargando perfil:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.user-profile-view {
  min-height: 100vh;
  background: var(--wa-bg);
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.profile-header {
  background: var(--wa-card);
  padding: 1rem 2rem;
  box-shadow: var(--wa-shadow);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: var(--wa-radius);
  margin-bottom: 1rem;
}

.back-btn {
  background: var(--wa-green);
  color: white;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: var(--wa-green-dark);
}

.profile-header h1 {
  margin: 0;
  color: var(--wa-green);
  font-size: 1.8rem;
}

.main-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
}

.photo-gallery {
  position: relative;
  background: var(--wa-card);
  margin-bottom: 2rem;
  border-radius: var(--wa-radius);
  overflow: hidden;
  box-shadow: var(--wa-shadow);
  height: 500px;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.main-photo {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-photo {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wa-accent);
  color: #666;
  font-size: 1.2rem;
}

/* Botones superpuestos sobre la imagen */
.overlay-buttons {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 160px;
  pointer-events: none;
  z-index: 15;
}

.overlay-buttons .action-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.overlay-buttons .action-btn:hover {
  transform: scale(1.1);
}

.overlay-buttons .action-btn.like {
  background: var(--wa-green);
  color: white;
}

.overlay-buttons .action-btn.like:hover {
  background: var(--wa-green-dark);
  box-shadow: 0 6px 20px rgba(7, 94, 84, 0.4);
}

.overlay-buttons .action-btn.dislike {
  background: var(--wa-danger);
  color: white;
}

.overlay-buttons .action-btn.dislike:hover {
  background: #c82333;
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.overlay-buttons .icon {
  font-size: 1.5rem;
}

/* Navegación de fotos con botones laterales */
.photo-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none; /* Permite que los clics pasen a través del contenedor */
}

.nav-btn {
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  width: 60px;
  height: 100%;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  pointer-events: auto; /* Restaura los clics en los botones */
  backdrop-filter: blur(2px);
}

.nav-btn:hover:not(:disabled) {
  background: rgba(0,0,0,0.8);
  width: 80px;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(0,0,0,0.3);
}

.nav-btn.prev {
  border-radius: 0 8px 8px 0;
}

.nav-btn.next {
  border-radius: 8px 0 0 8px;
}

/* Indicadores de fotos */
.photo-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: background-color 0.2s;
}

.indicator.active {
  background: white;
}

.profile-info {
  background: var(--wa-card);
  padding: 2rem;
  border-radius: var(--wa-radius);
  box-shadow: var(--wa-shadow);
}

.location p {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
}

.description h3, .details h3 {
  margin: 0 0 1rem 0;
  color: var(--wa-green);
  font-size: 1.3rem;
}

.description p {
  color: #555;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 800;
  color: var(--wa-green);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  border-bottom: 2px solid var(--wa-green);
  padding-bottom: 2px;
}

.value {
  color: #34495e;
  font-size: 1.1rem;
  font-weight: 600;
  background: var(--wa-accent);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid var(--wa-green);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--wa-green);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1200px) {
  .main-content {
    padding: 1.5rem;
  }
  
  .overlay-buttons {
    gap: 120px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    max-width: 100%;
  }
  
  .profile-header {
    padding: 1rem;
  }
  
  .photo-gallery {
    height: 450px;
    max-width: 100%;
    margin-bottom: 1rem;
  }
  
  .overlay-buttons .action-btn {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
  
  .overlay-buttons .icon {
    font-size: 1.2rem;
  }
  
  .overlay-buttons {
    gap: 80px;
  }
  
  .nav-btn {
    width: 40px;
    font-size: 1.5rem;
  }
  
  .nav-btn:hover:not(:disabled) {
    width: 50px;
  }
  
  .profile-info {
    padding: 1.5rem;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (min-width: 1400px) {
  .main-content {
    padding: 3rem;
    max-width: 1000px;
  }
  
  .photo-gallery {
    height: 600px;
    max-width: 600px;
  }
  
  .overlay-buttons {
    gap: 200px;
  }
}
</style> 