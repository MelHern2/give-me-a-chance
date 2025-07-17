<template>
  <div class="profiles-view">
    <header class="page-header">
      <h1>Perfiles</h1>
      <p>Explora y encuentra personas compatibles contigo</p>
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
  background: var(--wa-bg);
}
</style> 