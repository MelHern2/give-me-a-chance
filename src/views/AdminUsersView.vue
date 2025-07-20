<template>
  <div class="admin-users-view">
    <header class="page-header">
      <h1>Administración de Usuarios</h1>
      <p>Busca y gestiona usuarios de la plataforma</p>
    </header>
    
    <div class="users-container">
      <!-- Filtros de búsqueda -->
      <div class="search-filters">
        <div class="filter-row">
          <div class="filter-group">
            <label for="name-filter">Nombre:</label>
            <input 
              id="name-filter" 
              type="text" 
              v-model="filters.name" 
              placeholder="Buscar por nombre..."
              @input="debounceSearch"
            />
          </div>
          
          <div class="filter-group">
            <label for="email-filter">Email:</label>
            <input 
              id="email-filter" 
              type="email" 
              v-model="filters.email" 
              placeholder="Buscar por email..."
              @input="debounceSearch"
            />
          </div>
          
          <div class="filter-group">
            <label for="country-filter">País:</label>
            <select id="country-filter" v-model="filters.country" @change="searchUsers">
              <option value="">Todos los países</option>
              <option v-for="country in availableCountries" :key="country" :value="country">
                {{ country }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-row">
          <div class="filter-group">
            <label for="region-filter">Región:</label>
            <select id="region-filter" v-model="filters.region" @change="searchUsers">
              <option value="">Todas las regiones</option>
              <option v-for="region in availableRegions" :key="region" :value="region">
                {{ region }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="city-filter">Ciudad:</label>
            <input 
              id="city-filter" 
              type="text" 
              v-model="filters.city" 
              placeholder="Buscar por ciudad..."
              @input="debounceSearch"
            />
          </div>
          
          <div class="filter-group">
            <label for="gender-filter">Género:</label>
            <select id="gender-filter" v-model="filters.gender" @change="searchUsers">
              <option value="">Todos los géneros</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="no-binario">No binario</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        
        <div class="filter-row">
          <div class="filter-group">
            <label for="verification-filter">Verificación:</label>
            <select id="verification-filter" v-model="filters.verification" @change="searchUsers">
              <option value="">Todos</option>
              <option value="verified">Verificados</option>
              <option value="super-verified">Super Verificados</option>
              <option value="unverified">No Verificados</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="age-min">Edad mínima:</label>
            <input 
              id="age-min" 
              type="number" 
              v-model="filters.ageMin" 
              min="18" 
              max="100"
              @input="debounceSearch"
            />
          </div>
          
          <div class="filter-group">
            <label for="age-max">Edad máxima:</label>
            <input 
              id="age-max" 
              type="number" 
              v-model="filters.ageMax" 
              min="18" 
              max="100"
              @input="debounceSearch"
            />
          </div>
        </div>
        
        <div class="search-actions">
          <button @click="performSearch" class="btn btn-primary">
            🔍 Buscar Usuarios
          </button>
          <button @click="clearFilters" class="btn btn-secondary">
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      <!-- Resultados de búsqueda -->
      <div class="search-results">
        <div v-if="loading" class="loading">
          <p>Buscando usuarios...</p>
        </div>
        
        <div v-else-if="users.length === 0 && hasSearched" class="no-results">
          <h3>No se encontraron usuarios</h3>
          <p>Intenta con otros filtros de búsqueda</p>
        </div>
        
        <div v-else-if="!hasSearched" class="search-prompt">
          <h3>Busca usuarios</h3>
          <p>Usa los filtros arriba para buscar usuarios específicos</p>
        </div>
        
        <div v-else class="users-grid">
          <div v-for="user in users" :key="user.id" class="user-card">
            <div class="user-header">
              <div class="user-photo">
                <img 
                  :src="user.photoURL || user.photos?.[0] || '/default-avatar.svg'" 
                  :alt="user.name"
                  @error="e => e.target.src = '/default-avatar.svg'"
                />
              </div>
              
              <div class="user-info">
                <h4>{{ user.name }}, {{ user.age }}</h4>
                <p class="user-location">{{ user.city }}, {{ user.country }}</p>
                <p class="user-email">{{ user.email }}</p>
                
                <!-- Estado de verificación -->
                <div class="verification-status">
                  <div v-if="user.isSuperVerified" class="verification-badge super-verified">
                    <span class="badge-icon">✓✓</span>
                    <span class="badge-text">Super Verificado</span>
                  </div>
                  <div v-else-if="user.isVerified" class="verification-badge verified">
                    <span class="badge-icon">✓</span>
                    <span class="badge-text">Verificado</span>
                  </div>
                  <div v-else class="verification-badge unverified">
                    <span class="badge-icon">?</span>
                    <span class="badge-text">No Verificado</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="user-details">
              <div class="detail-item">
                <span class="label">Género:</span>
                <span class="value">{{ user.gender || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Orientación:</span>
                <span class="value">{{ user.sexualOrientation || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Relación:</span>
                <span class="value">{{ user.relationshipType || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Registrado:</span>
                <span class="value">{{ formatDate(user.createdAt) }}</span>
              </div>
            </div>
            
            <div class="user-actions">
              <button @click="viewUserProfile(user.id)" class="btn btn-info">
                👁️ Ver Perfil
              </button>
              
              <button 
                v-if="user.isVerified || user.isSuperVerified"
                @click="removeVerification(user.id)"
                class="btn btn-warning"
              >
                🚫 Quitar Verificación
              </button>
              
              <button 
                v-if="!user.isVerified && !user.isSuperVerified"
                @click="addVerification(user.id)"
                class="btn btn-success"
              >
                ✅ Verificar
              </button>
              
              <button @click="banUserAction(user.id)" class="btn btn-danger">
                🚫 Banear
              </button>
            </div>
          </div>
        </div>
        
        <!-- Paginación -->
        <div v-if="users.length > 0" class="pagination">
          <button 
            @click="previousPage" 
            :disabled="currentPage <= 1"
            class="btn btn-secondary"
          >
            ← Anterior
          </button>
          
          <span class="page-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage >= totalPages"
            class="btn btn-secondary"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { getCountries, getRegions } from '@/utils/location';
import { searchUsers, removeUserVerification, addUserVerification, banUser, reloadUserData } from '@/services/admin';

const authStore = useAuthStore();
const router = useRouter();

// Verificar si el usuario es admin
const isAdmin = computed(() => authStore.user?.isAdmin);

// Redirigir si no es admin
if (!isAdmin.value) {
  router.push('/');
}

// Estados reactivos
const users = ref<any[]>([]);
const loading = ref(false);
const hasSearched = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = 20;

// Filtros de búsqueda
const filters = ref({
  name: '',
  email: '',
  country: '',
  region: '',
  city: '',
  gender: '',
  verification: '',
  ageMin: '',
  ageMax: ''
});

// Opciones disponibles
const availableCountries = ref(getCountries());
const availableRegions = ref<string[]>([]);

// Debounce para búsqueda
let searchTimeout: NodeJS.Timeout;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch();
  }, 500);
};

// Buscar usuarios
const performSearch = async () => {
  if (!isAdmin.value) return;
  
  loading.value = true;
  hasSearched.value = true;
  
  try {
    const result = await searchUsers(filters.value, currentPage.value, itemsPerPage);
    users.value = result.users;
    totalPages.value = Math.ceil(result.total / itemsPerPage);
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    alert('Error al buscar usuarios');
  } finally {
    loading.value = false;
  }
};

// Limpiar filtros
const clearFilters = () => {
  filters.value = {
    name: '',
    email: '',
    country: '',
    region: '',
    city: '',
    gender: '',
    verification: '',
    ageMin: '',
    ageMax: ''
  };
  users.value = [];
  hasSearched.value = false;
  currentPage.value = 1;
};

// Navegación de páginas
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    performSearch();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    performSearch();
  }
};

// Acciones de usuario
const viewUserProfile = (userId: string) => {
  router.push(`/profile?id=${userId}`);
};

const removeVerification = async (userId: string) => {
  if (!confirm('¿Estás seguro de que quieres quitar la verificación a este usuario?')) {
    return;
  }
  
  try {
    await removeUserVerification(userId);
    
    // Recargar datos del usuario si es el usuario actual
    if (authStore.user && authStore.user.id === userId) {
      await reloadUserData(userId);
    }
    
    alert('Verificación removida exitosamente');
    performSearch(); // Recargar resultados
  } catch (error) {
    console.error('Error removiendo verificación:', error);
    alert('Error al remover verificación');
  }
};

const addVerification = async (userId: string) => {
  if (!confirm('¿Estás seguro de que quieres verificar a este usuario?')) {
    return;
  }
  
  try {
    await addUserVerification(userId);
    
    // Recargar datos del usuario si es el usuario actual
    if (authStore.user && authStore.user.id === userId) {
      await reloadUserData(userId);
    }
    
    alert('Usuario verificado exitosamente');
    performSearch(); // Recargar resultados
  } catch (error) {
    console.error('Error verificando usuario:', error);
    alert('Error al verificar usuario');
  }
};

const banUserAction = async (userId: string) => {
  if (!confirm('¿Estás seguro de que quieres banear a este usuario? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    await banUser(userId);
    alert('Usuario baneado exitosamente');
    performSearch(); // Recargar resultados
  } catch (error) {
    console.error('Error baneando usuario:', error);
    alert('Error al banear usuario');
  }
};

// Formatear fecha
const formatDate = (date: Date) => {
  if (!date) return 'No disponible';
  return new Date(date).toLocaleDateString('es-ES');
};

// Cargar regiones cuando cambie el país
const handleCountryChange = () => {
  if (filters.value.country) {
    availableRegions.value = getRegions(filters.value.country);
  } else {
    availableRegions.value = [];
  }
  filters.value.region = '';
};

// Observar cambios en el país
import { watch } from 'vue';
watch(() => filters.value.country, handleCountryChange);
</script>

<style scoped>
.admin-users-view {
  min-height: 100vh;
  background: var(--wa-bg);
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--wa-primary);
  margin-bottom: 0.5rem;
}

.users-container {
  max-width: 1200px;
  margin: 0 auto;
}

.search-filters {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--wa-text);
}

.filter-group input,
.filter-group select {
  padding: 0.75rem;
  border: 2px solid var(--wa-border);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: var(--wa-primary);
}

.search-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.search-results {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.loading,
.no-results,
.search-prompt {
  padding: 3rem;
  text-align: center;
  color: var(--wa-text-secondary);
}

.users-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.user-card {
  border: 2px solid var(--wa-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.user-card:hover {
  border-color: var(--wa-primary);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.user-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--wa-text);
}

.user-location,
.user-email {
  margin: 0.25rem 0;
  color: var(--wa-text-secondary);
  font-size: 0.9rem;
}

.verification-status {
  margin-top: 0.5rem;
}

.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.verification-badge.verified {
  background: #e8f5e8;
  color: #2e7d32;
}

.verification-badge.super-verified {
  background: #fff3e0;
  color: #f57c00;
}

.verification-badge.unverified {
  background: #ffebee;
  color: #c62828;
}

.user-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 1rem;
  background: var(--wa-bg);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.detail-item .label {
  font-weight: 600;
  color: var(--wa-text-secondary);
}

.detail-item .value {
  color: var(--wa-text);
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--wa-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--wa-primary-dark);
}

.btn-secondary {
  background: var(--wa-secondary);
  color: var(--wa-text);
}

.btn-secondary:hover {
  background: var(--wa-secondary-dark);
}

.btn-info {
  background: #2196f3;
  color: white;
}

.btn-info:hover {
  background: #1976d2;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover {
  background: #f57c00;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover {
  background: #388e3c;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-top: 1px solid var(--wa-border);
}

.page-info {
  font-weight: 600;
  color: var(--wa-text);
}

@media (max-width: 768px) {
  .admin-users-view {
    padding: 1rem;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .user-actions {
    justify-content: center;
  }
  
  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 