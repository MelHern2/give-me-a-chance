<template>
  <div class="autocomplete-container">
    <input
      :id="id"
      :value="modelValue"
      @input="handleInput"
      @focus="showSuggestions = true"
      @blur="handleBlur"
      @keydown="handleKeydown"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="autocomplete-input"
      :class="{ 'disabled': disabled }"
    />
    <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
        @mouseenter="highlightedIndex = index"
        :class="['suggestion-item', { 'highlighted': index === highlightedIndex }]"
      >
        {{ suggestion }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: string;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  id: '',
  disabled: false,
  required: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showSuggestions = ref(false);
const highlightedIndex = ref(-1);
const searchTerm = ref(props.modelValue);

// Filtrar sugerencias basadas en el término de búsqueda
const filteredSuggestions = computed(() => {
  if (!searchTerm.value) return props.suggestions.slice(0, 10); // Mostrar primeras 10 si no hay búsqueda
  
  return props.suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
    .slice(0, 10); // Limitar a 10 resultados
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchTerm.value = target.value;
  emit('update:modelValue', target.value);
  showSuggestions.value = true;
  highlightedIndex.value = -1;
};

const selectSuggestion = (suggestion: string) => {
  searchTerm.value = suggestion;
  emit('update:modelValue', suggestion);
  showSuggestions.value = false;
  highlightedIndex.value = -1;
};

const handleBlur = () => {
  // Pequeño delay para permitir que el click en las sugerencias funcione
  setTimeout(() => {
    showSuggestions.value = false;
    highlightedIndex.value = -1;
  }, 150);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || filteredSuggestions.value.length === 0) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredSuggestions.value.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (highlightedIndex.value >= 0) {
        selectSuggestion(filteredSuggestions.value[highlightedIndex.value]);
      }
      break;
    case 'Escape':
      showSuggestions.value = false;
      highlightedIndex.value = -1;
      break;
  }
};

// Actualizar searchTerm cuando cambie el modelValue externamente
watch(() => props.modelValue, (newValue) => {
  searchTerm.value = newValue;
});
</script>

<style scoped>
.autocomplete-container {
  position: relative;
  width: 100%;
}

.autocomplete-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #fff;
  transition: border-color 0.3s ease;
}

.autocomplete-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.autocomplete-input.disabled {
  background-color: #f0f0f0;
  color: #888;
  cursor: not-allowed;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: #f8f9fa;
}

.suggestion-item:not(:last-child) {
  border-bottom: 1px solid #eee;
}
</style> 