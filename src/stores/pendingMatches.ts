import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getPendingMatches } from '@/services/pendingMatches';

export const usePendingMatchesStore = defineStore('pendingMatches', () => {
  const pendingMatches = ref<any[]>([]);
  const pendingMatchesCount = ref(0);

  const loadPendingMatches = async (userId: string) => {
    try {
      const matches = await getPendingMatches(userId);
      pendingMatches.value = matches;
      pendingMatchesCount.value = matches.length;
      console.log(`📊 Matches pendientes cargados: ${matches.length}`);
    } catch (error) {
      console.error('Error cargando matches pendientes:', error);
    }
  };

  const removePendingMatch = (matchId: string) => {
    pendingMatches.value = pendingMatches.value.filter(match => match.id !== matchId);
    pendingMatchesCount.value = pendingMatches.value.length;
    console.log(`🗑️ Match pendiente eliminado. Restantes: ${pendingMatchesCount.value}`);
  };

  const markMatchAsActive = (matchId: string) => {
    // Remover el match de la lista de pendientes cuando se convierte en activo
    removePendingMatch(matchId);
    console.log(`✅ Match ${matchId} marcado como activo, removido de pendientes`);
  };

  const clearPendingMatches = () => {
    pendingMatches.value = [];
    pendingMatchesCount.value = 0;
  };

  return {
    pendingMatches,
    pendingMatchesCount,
    loadPendingMatches,
    removePendingMatch,
    markMatchAsActive,
    clearPendingMatches
  };
}); 