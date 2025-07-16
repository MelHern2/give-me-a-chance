<template>
  <div class="admin-reports-view">
    <header class="page-header">
      <h1>Administración de Reportes</h1>
      <p>Gestiona los reportes de usuarios de la comunidad</p>
    </header>
    
    <div class="reports-container">
      <!-- Filtros -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="status-filter">Estado:</label>
          <select id="status-filter" v-model="statusFilter" @change="loadReports">
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="investigating">En Investigación</option>
            <option value="resolved">Resueltos</option>
            <option value="dismissed">Descartados</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="type-filter">Tipo:</label>
          <select id="type-filter" v-model="typeFilter" @change="loadReports">
            <option value="">Todos</option>
            <option value="inappropriate">Contenido Inapropiado</option>
            <option value="harassment">Acoso</option>
            <option value="fake">Perfil Falso</option>
            <option value="spam">Spam</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-filter">Fecha:</label>
          <select id="date-filter" v-model="dateFilter" @change="loadReports">
            <option value="">Todas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
          </select>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="stats-section">
        <div class="stat-card">
          <h3>{{ stats.total }}</h3>
          <p>Total Reportes</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.pending }}</h3>
          <p>Pendientes</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.resolved }}</h3>
          <p>Resueltos</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.thisWeek }}</h3>
          <p>Esta Semana</p>
        </div>
      </div>

      <!-- Lista de reportes -->
      <div class="reports-list">
        <div v-if="loading" class="loading">
          <p>Cargando reportes...</p>
        </div>
        
        <div v-else-if="reports.length === 0" class="no-reports">
          <h3>No hay reportes</h3>
          <p>No se encontraron reportes con los filtros aplicados</p>
        </div>
        
        <div v-else class="reports-grid">
          <div v-for="report in reports" :key="report.id" class="report-card">
            <div class="report-header">
              <div class="report-info">
                <h4>Reporte #{{ report.id.slice(-6) }}</h4>
                <span :class="['status-badge', `status-${report.status}`]">
                  {{ getStatusText(report.status) }}
                </span>
              </div>
              <div class="report-date">
                {{ formatDate(report.createdAt) }}
              </div>
            </div>
            
            <div class="report-content">
              <div class="user-info">
                <p><strong>Reportado por:</strong> {{ report.reporterName }}</p>
                <p><strong>Usuario reportado:</strong> {{ report.reportedUserName }}</p>
                <p><strong>Tipo:</strong> {{ getTypeText(report.type) }}</p>
              </div>
              
              <div class="report-reason">
                <p><strong>Motivo:</strong></p>
                <p>{{ report.reason }}</p>
              </div>
              
              <div v-if="report.evidence" class="report-evidence">
                <p><strong>Evidencia:</strong></p>
                <p>{{ report.evidence }}</p>
              </div>
            </div>
            
            <div class="report-actions">
              <button 
                v-if="report.status === 'pending'"
                @click="updateReportStatus(report.id, 'investigating')"
                class="btn btn-warning"
              >
                Investigar
              </button>
              
              <button 
                v-if="report.status === 'investigating'"
                @click="updateReportStatus(report.id, 'resolved')"
                class="btn btn-success"
              >
                Resolver
              </button>
              
              <button 
                v-if="report.status === 'pending' || report.status === 'investigating'"
                @click="updateReportStatus(report.id, 'dismissed')"
                class="btn btn-secondary"
              >
                Descartar
              </button>
              
              <button 
                @click="viewUserProfile(report.reportedUserId)"
                class="btn btn-info"
              >
                Ver Perfil
              </button>
              
              <button 
                v-if="report.status === 'resolved'"
                @click="banUser(report.reportedUserId)"
                class="btn btn-danger"
              >
                Banear Usuario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { getReports, updateReportStatus } from '@/services/reports';
import { banUser as banUserService } from '@/services/admin';

const authStore = useAuthStore();
const router = useRouter();

// Verificar si el usuario es admin
const isAdmin = computed(() => authStore.user?.isAdmin);

// Redirigir si no es admin
if (!isAdmin.value) {
  router.push('/');
}

// Estados reactivos
const reports = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref('');
const typeFilter = ref('');
const dateFilter = ref('');

// Estadísticas
const stats = ref({
  total: 0,
  pending: 0,
  resolved: 0,
  thisWeek: 0
});

// Cargar reportes
const loadReports = async () => {
  if (!isAdmin.value) return;
  
  loading.value = true;
  try {
    const filters = {
      status: statusFilter.value || undefined,
      type: typeFilter.value || undefined,
      date: dateFilter.value || undefined
    };
    
    const data = await getReports(filters);
    reports.value = data.reports;
    stats.value = data.stats;
  } catch (error) {
    console.error('Error loading reports:', error);
    alert('Error al cargar los reportes');
  } finally {
    loading.value = false;
  }
};

// Actualizar estado de un reporte
const updateReportStatus = async (reportId: string, status: string) => {
  try {
    await updateReportStatus(reportId, status);
    await loadReports(); // Recargar reportes
    alert('Estado del reporte actualizado correctamente');
  } catch (error) {
    console.error('Error updating report status:', error);
    alert('Error al actualizar el estado del reporte');
  }
};

// Banear usuario
const banUser = async (userId: string) => {
  if (confirm('¿Estás seguro de que quieres banear a este usuario? Esta acción no se puede deshacer.')) {
    try {
      await banUserService(userId);
      alert('Usuario baneado correctamente');
      await loadReports(); // Recargar reportes
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error al banear al usuario');
    }
  }
};

// Ver perfil del usuario reportado
const viewUserProfile = (userId: string) => {
  router.push(`/profile?id=${userId}`);
};

// Formatear fecha
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Obtener texto del estado
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: 'Pendiente',
    investigating: 'En Investigación',
    resolved: 'Resuelto',
    dismissed: 'Descartado'
  };
  return statusMap[status] || status;
};

// Obtener texto del tipo
const getTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    inappropriate: 'Contenido Inapropiado',
    harassment: 'Acoso',
    fake: 'Perfil Falso',
    spam: 'Spam',
    other: 'Otro'
  };
  return typeMap[type] || type;
};

// Cargar reportes al montar el componente
onMounted(() => {
  loadReports();
});
</script>

<style scoped>
.admin-reports-view {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2.5rem;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.reports-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #667eea;
  font-size: 2rem;
}

.stat-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.reports-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.loading, .no-reports {
  padding: 3rem;
  text-align: center;
  color: #666;
}

.reports-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-card {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.report-card:last-child {
  border-bottom: none;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.report-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-info h4 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-investigating {
  background: #cce5ff;
  color: #004085;
}

.status-resolved {
  background: #d4edda;
  color: #155724;
}

.status-dismissed {
  background: #f8d7da;
  color: #721c24;
}

.report-date {
  font-size: 0.9rem;
  color: #666;
}

.report-content {
  margin-bottom: 1rem;
}

.user-info p, .report-reason p, .report-evidence p {
  margin: 0.5rem 0;
  color: #555;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: opacity 0.3s ease;
}

.btn:hover {
  opacity: 0.8;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .report-actions {
    justify-content: center;
  }
}
</style> 