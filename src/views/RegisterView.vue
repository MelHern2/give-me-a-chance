<template>
  <div class="register-view">
    <div class="register-container">
      <div class="register-header">
        <h1>Únete a Give me a chance</h1>
        <p>Crea tu perfil y comienza a conocer personas increíbles</p>
      </div>
      
      <RegisterForm />
      
      <div class="login-link">
        ¿Ya tienes una cuenta? 
        <router-link to="/login">Inicia sesión aquí</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RegisterForm from '@/components/RegisterForm.vue';
</script>

<style scoped>
.register-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.register-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 100%;
  max-width: none;
  margin: 0;
  overflow: hidden;
}

.register-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.register-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
}

.register-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.login-link {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style> 