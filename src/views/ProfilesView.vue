<template>
  <div class="profiles-view">
    <header class="page-header">
      <h1>Explorar Perfiles</h1>
      <p>Descubre personas cerca de ti que comparten tus intereses</p>
    </header>
    
    <ProfileList />
  </div>
</template>

<script setup lang="ts">
import ProfileList from '@/components/ProfileList.vue';
</script>

<style scoped>
.profiles-view {
  min-height: 100vh;
  background: #f8f9fa;
  width: 100%;
  max-width: none;
  margin: 0;
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
</style> 