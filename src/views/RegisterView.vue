<template>
  <div class="register-view">
    <header class="page-header">
      <h1>Únete a Give me a chance</h1>
      <p>Crea tu perfil y comienza a conocer personas increíbles</p>
    </header>
    <div class="register-container card">
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
  background: var(--wa-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.register-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}
.login-link {
  text-align: center;
  padding: 1.5rem;
  color: #666;
}
.login-link a {
  color: var(--wa-green);
  text-decoration: none;
  font-weight: 600;
}
.login-link a:hover {
  text-decoration: underline;
}
</style> 