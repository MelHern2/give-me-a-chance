<template>
  <div class="terms-container">
    <div class="terms-content">
      <div class="terms-header">
        <h1>Términos y Condiciones</h1>
        <p class="subtitle">Por favor, lee cuidadosamente antes de continuar</p>
      </div>

      <div class="terms-body">
        <div class="terms-section">
          <h2>1. Uso de la Aplicación</h2>
          <p>Al utilizar esta aplicación de citas, aceptas cumplir con estos términos y condiciones de uso.</p>
        </div>

        <div class="terms-section">
          <h2>2. Privacidad y Datos Personales</h2>
          <p><strong>Compromiso de Privacidad:</strong> Nos comprometemos a proteger tu privacidad y a no utilizar tu información personal para fines ajenos a la propia aplicación.</p>
          
          <h3>Información que Recopilamos:</h3>
          <ul>
            <li>Información de perfil (nombre, edad, ubicación, fotos)</li>
            <li>Preferencias de citas</li>
            <li>Interacciones dentro de la aplicación</li>
            <li>Datos de ubicación (solo para mostrar perfiles cercanos)</li>
          </ul>

          <h3>Uso de la Información:</h3>
          <ul>
            <li>Mostrar tu perfil a otros usuarios</li>
            <li>Facilitar conexiones y matches</li>
            <li>Mejorar la experiencia de usuario</li>
            <li>Enviar notificaciones relevantes</li>
          </ul>

          <p><strong>No compartiremos, venderemos ni utilizaremos tu información para fines comerciales externos.</strong></p>
        </div>

        <div class="terms-section">
          <h2>3. Conducta del Usuario</h2>
          <p>Te comprometes a:</p>
          <ul>
            <li>Proporcionar información veraz y actualizada</li>
            <li>Respetar a otros usuarios</li>
            <li>No utilizar la aplicación para actividades ilegales</li>
            <li>No acosar o intimidar a otros usuarios</li>
            <li>Reportar comportamientos inapropiados</li>
          </ul>
        </div>

        <div class="terms-section">
          <h2>4. Responsabilidades</h2>
          <p>Eres responsable de:</p>
          <ul>
            <li>Mantener la confidencialidad de tu cuenta</li>
            <li>Todas las actividades que ocurran bajo tu cuenta</li>
            <li>El contenido que compartas en la aplicación</li>
            <li>Las interacciones que tengas con otros usuarios</li>
          </ul>
        </div>

        <div class="terms-section">
          <h2>5. Limitaciones</h2>
          <p>La aplicación se proporciona "tal como está" y no garantizamos:</p>
          <ul>
            <li>La disponibilidad continua del servicio</li>
            <li>La compatibilidad con todos los dispositivos</li>
            <li>El éxito en encontrar matches</li>
            <li>La veracidad de la información de otros usuarios</li>
          </ul>
        </div>

        <div class="terms-section">
          <h2>6. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la aplicación.</p>
        </div>

        <div class="terms-section">
          <h2>7. Contacto</h2>
          <p>Si tienes preguntas sobre estos términos o la privacidad, puedes contactarnos a través de la aplicación.</p>
        </div>
      </div>

      <div class="terms-actions">
        <button @click="acceptTerms" class="btn-accept">
          Acepto los Términos y Condiciones
        </button>
        <button @click="rejectTerms" class="btn-reject">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const acceptTerms = () => {
  // Marcar que el usuario ha aceptado los términos usando el store
  authStore.acceptTerms();
  
  // Forzar recarga para actualizar el estado
  window.location.href = '/';
};

const rejectTerms = () => {
  // Si el usuario rechaza, hacer logout y volver al login
  authStore.logout();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.terms-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terms-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.terms-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.terms-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.terms-body {
  margin-bottom: 30px;
}

.terms-section {
  margin-bottom: 25px;
}

.terms-section h2 {
  color: #333;
  font-size: 1.4rem;
  margin-bottom: 15px;
  font-weight: 600;
  border-left: 4px solid #667eea;
  padding-left: 15px;
}

.terms-section h3 {
  color: #444;
  font-size: 1.1rem;
  margin: 15px 0 10px 0;
  font-weight: 600;
}

.terms-section p {
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
}

.terms-section ul {
  margin: 10px 0;
  padding-left: 20px;
}

.terms-section li {
  color: #555;
  line-height: 1.6;
  margin-bottom: 8px;
}

.terms-section strong {
  color: #333;
  font-weight: 600;
}

.terms-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.btn-accept, .btn-reject {
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.btn-accept {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-accept:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-reject {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #ddd;
}

.btn-reject:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

/* Responsive */
@media (max-width: 768px) {
  .terms-container {
    padding: 10px;
  }
  
  .terms-content {
    padding: 20px;
  }
  
  .terms-header h1 {
    font-size: 2rem;
  }
  
  .terms-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-accept, .btn-reject {
    width: 100%;
    max-width: 300px;
  }
}

/* Scrollbar personalizado */
.terms-content::-webkit-scrollbar {
  width: 8px;
}

.terms-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.terms-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.terms-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 