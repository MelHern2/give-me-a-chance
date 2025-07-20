<template>
  <div class="photo-verification">
    <div class="verification-container">
      <!-- Paso 1: Instrucciones -->
      <div v-if="step === 'intro'" class="verification-step">
        <h2>Verificación con Foto</h2>
        <p>Para completar la verificación, necesitamos una foto de tu rostro con el símbolo V de la victoria.</p>
        
        <div class="instructions">
          <h3>Instrucciones:</h3>
          <ol>
            <li>Asegúrate de estar en un lugar bien iluminado</li>
            <li>Muestra tu rostro claramente</li>
            <li>Haz el símbolo V con los dedos índice y medio</li>
            <li>Sube una foto donde se vea claramente tu rostro</li>
          </ol>
        </div>
        
        <div class="example-photo">
          <div class="example-icon">✌️</div>
          <p>Ejemplo de la pose requerida</p>
        </div>
        
        <button @click="startUpload" class="btn-primary">Subir Foto</button>
        <button @click="goBack" class="btn-secondary">Volver</button>
      </div>
      
      <!-- Paso 2: Subida de foto -->
      <div v-else-if="step === 'upload'" class="verification-step">
        <h2>Subir Foto</h2>
        <p>Selecciona una foto donde se vea claramente tu rostro con el símbolo V</p>
        
        <div class="upload-container">
          <div class="upload-area" @click="triggerFileInput" @drop="handleDrop" @dragover.prevent>
            <div class="upload-icon">📷</div>
            <p>Haz clic para seleccionar una foto o arrastra aquí</p>
            <p class="upload-hint">Formatos: JPG, PNG, GIF (máx. 5MB)</p>
          </div>
          
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            @change="handleFileSelect" 
            style="display: none;"
          />
        </div>
        
        <div class="upload-controls">
          <button @click="resetVerification" class="btn-secondary">Cancelar</button>
        </div>
      </div>
      
      <!-- Paso 3: Revisión de foto -->
      <div v-else-if="step === 'review'" class="verification-step">
        <h2>Revisa tu Foto</h2>
        <p>Verifica que la foto sea clara y muestre el símbolo V correctamente</p>
        
        <div class="photo-review">
          <img :src="uploadedPhoto" alt="Foto subida" class="uploaded-photo" />
          <div class="photo-overlay">
            <div class="v-symbol-check">✌️</div>
          </div>
        </div>
        
        <div class="review-controls">
          <button @click="acceptPhoto" class="btn-primary">Aceptar Foto</button>
          <button @click="retakePhoto" class="btn-secondary">Subir Otra Foto</button>
        </div>
      </div>
      
      <!-- Paso 4: Resultado -->
      <div v-else-if="step === 'result'" class="verification-step">
        <div v-if="verificationSuccess" class="verification-success">
          <div class="success-icon">✓</div>
          <h2>¡Verificación Exitosa!</h2>
          <p>Tu foto ha sido verificada correctamente.</p>
          <p>Tu perfil ahora está verificado.</p>
        </div>
        
        <div v-else class="verification-failed">
          <div class="failed-icon">✗</div>
          <h2>Verificación Fallida</h2>
          <p>No pudimos completar la verificación.</p>
          <p>{{ errorMessage }}</p>
        </div>
        
        <div class="result-actions">
          <button v-if="!verificationSuccess" @click="startUpload" class="btn-primary">Intentar de nuevo</button>
          <button @click="finishVerification" class="btn-secondary">{{ verificationSuccess ? 'Continuar' : 'Volver' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { detectFace, compareFaces } from '@/services/verification';
import { useAuthStore } from '@/stores/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { notify } from '@/services/notifications';

// Props y emits
const props = defineProps<{
  onComplete?: (success: boolean) => void;
}>();

const emit = defineEmits(['complete']);

// Referencias a elementos DOM
const fileInput = ref<HTMLInputElement | null>(null);

// Estado de la verificación
const step = ref<'intro' | 'upload' | 'review' | 'result'>('intro');
const uploadedPhoto = ref<string | null>(null);
const verificationSuccess = ref(false);
const errorMessage = ref('');

// Auth store
const authStore = useAuthStore();

// Iniciar subida
const startUpload = () => {
  step.value = 'upload';
};

// Activar input de archivo
const triggerFileInput = () => {
  fileInput.value?.click();
};

// Manejar selección de archivo
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    processFile(file);
  }
};

// Manejar drop de archivo
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      processFile(file);
    }
  }
};

// Procesar archivo
const processFile = (file: File) => {
  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'El archivo es demasiado grande. Máximo 5MB.';
    step.value = 'result';
    return;
  }
  
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Por favor, selecciona un archivo de imagen válido.';
    step.value = 'result';
    return;
  }
  
  // Leer archivo
  const reader = new FileReader();
  reader.onload = async (e) => {
    uploadedPhoto.value = e.target?.result as string;
    
    // Validar que la imagen contiene un rostro
    const isValid = await validatePhoto(uploadedPhoto.value);
    if (isValid) {
      step.value = 'review';
    } else {
      errorMessage.value = 'No se detectó un rostro claro en la imagen. Por favor, sube una foto donde se vea tu rostro con el símbolo V.';
      step.value = 'result';
      verificationSuccess.value = false;
    }
  };
  reader.readAsDataURL(file);
};

// Validar foto
const validatePhoto = async (imageData: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Crear canvas para procesar la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // 1. Verificar que hay un rostro en la imagen
        const detection = await detectFace(img);
        if (!detection) {
          console.log('❌ No se detectó rostro en la imagen');
          resolve(false);
          return;
        }
        
        console.log('✅ Rostro detectado en la imagen');
        
        // 2. Verificar que la imagen tiene un tamaño mínimo
        if (img.width < 200 || img.height < 200) {
          console.log('❌ Imagen demasiado pequeña');
          resolve(false);
          return;
        }
        
        // 3. Verificar que la imagen no está muy oscura o muy clara
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const brightness = calculateBrightness(imageData);
        
        if (brightness < 0.1 || brightness > 0.9) {
          console.log('❌ Imagen demasiado oscura o clara');
          resolve(false);
          return;
        }
        
        // 4. Verificar que la imagen tiene suficiente detalle
        const detailLevel = calculateDetailLevel(imageData);
        if (detailLevel < 0.3) {
          console.log('❌ Imagen con poco detalle (posiblemente genérica)');
          resolve(false);
          return;
        }
        
        // 5. Verificar coincidencia con foto de perfil
        const profileMatch = await verifyProfileMatch(img);
        if (!profileMatch) {
          console.log('❌ La foto no coincide con la foto de perfil');
          resolve(false);
          return;
        }
        
        console.log('✅ Foto coincide con perfil');
        
        // 6. Verificar símbolo V con los dedos
        const hasVSymbol = await detectVSymbol(img);
        if (!hasVSymbol) {
          console.log('❌ No se detectó el símbolo V con los dedos');
          resolve(false);
          return;
        }
        
        console.log('✅ Símbolo V detectado');
        console.log('✅ Imagen válida');
        resolve(true);
      } catch (error) {
        console.error('Error validando foto:', error);
        resolve(false);
      }
    };
    img.onerror = () => {
      console.log('❌ Error cargando imagen');
      resolve(false);
    };
    img.src = imageData;
  });
};

// Calcular brillo de la imagen
const calculateBrightness = (imageData: ImageData): number => {
  const data = imageData.data;
  let total = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total += (r + g + b) / 3;
  }
  
  return total / (data.length / 4) / 255;
};

// Calcular nivel de detalle de la imagen
const calculateDetailLevel = (imageData: ImageData): number => {
  const data = imageData.data;
  let totalVariation = 0;
  const width = imageData.width;
  const height = imageData.height;
  
  // Calcular variación entre píxeles adyacentes
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Comparar con píxeles adyacentes
      const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
      const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
      const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
      const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
      
      const variation = Math.abs(current - left) + Math.abs(current - right) + 
                       Math.abs(current - top) + Math.abs(current - bottom);
      totalVariation += variation;
    }
  }
  
  return totalVariation / (width * height * 255);
};

// Aceptar foto
const acceptPhoto = async () => {
  console.log('🔄 BOTÓN ACEPTAR FOTO CLICKEADO');
  console.log('🔄 Iniciando aceptación de foto...');
  console.log('Usuario actual:', authStore.user);
  console.log('Foto subida:', uploadedPhoto.value ? 'Sí' : 'No');
  
  try {
    // Verificar que hay un usuario autenticado
    if (!authStore.user) {
      console.error('❌ No hay usuario autenticado');
      errorMessage.value = 'No hay usuario autenticado. Por favor, inicia sesión.';
      verificationSuccess.value = false;
      step.value = 'result';
      return;
    }
    
    // Verificar que hay una foto subida
    if (!uploadedPhoto.value) {
      console.error('❌ No hay foto subida');
      errorMessage.value = 'No hay foto para verificar. Por favor, sube una foto.';
      verificationSuccess.value = false;
      step.value = 'result';
      return;
    }
    
    // Validar la foto una vez más antes de aceptar
    console.log('🔍 Validando foto antes de aceptar...');
    const isValid = await validatePhoto(uploadedPhoto.value);
    
    if (!isValid) {
      console.error('❌ La foto no pasa la validación final');
      errorMessage.value = 'La foto no cumple con los requisitos. Por favor, sube una foto donde se vea claramente tu rostro con el símbolo V.';
      verificationSuccess.value = false;
      step.value = 'result';
      return;
    }
    
    console.log('✅ Validaciones pasadas, guardando verificación...');
    
    // Guardar estado de verificación
    await saveVerificationStatus();
    verificationSuccess.value = true;
    step.value = 'result';
    
    console.log('✅ Verificación completada exitosamente');
    notify.verificationSuccess();
  } catch (error) {
    console.error('❌ Error en acceptPhoto:', error);
    notify.verificationError();
    errorMessage.value = 'Error al guardar la verificación. Por favor, intenta de nuevo.';
    verificationSuccess.value = false;
    step.value = 'result';
  }
};

// Subir otra foto
const retakePhoto = () => {
  uploadedPhoto.value = null;
  step.value = 'upload';
};

// Guardar estado de verificación
const saveVerificationStatus = async () => {
  console.log('🔄 Guardando estado de verificación...');
  console.log('Usuario ID:', authStore.user?.id);
  
  if (!authStore.user) {
    console.error('❌ No hay usuario para guardar');
    throw new Error('No hay usuario autenticado');
  }
  
  try {
    console.log('📝 Actualizando documento en Firestore...');
    
    // Actualizar estado de verificación en Firestore
    const userRef = doc(db, 'users', authStore.user.id);
    await updateDoc(userRef, {
      isVerified: true,
      verifiedAt: new Date(),
      verificationPhoto: uploadedPhoto.value,
      verificationType: 'photo'
    });
    
    console.log('✅ Documento actualizado en Firestore');
    
    // Actualizar usuario en el store
    console.log('🔄 Actualizando usuario en el store...');
    authStore.setUser({
      ...authStore.user,
      isVerified: true,
      verifiedAt: new Date()
    });
    
    console.log('✅ Usuario actualizado en el store');
    console.log('✅ Verificación con foto guardada correctamente');
  } catch (error) {
    console.error('❌ Error guardando verificación:', error);
    throw error;
  }
};

// Resetear verificación
const resetVerification = () => {
  step.value = 'intro';
  uploadedPhoto.value = null;
};

// Volver atrás
const goBack = () => {
  emit('complete', false);
};

// Finalizar verificación
const finishVerification = () => {
  emit('complete', verificationSuccess.value);
};

// Verificar coincidencia con foto de perfil
const verifyProfileMatch = async (uploadedImg: HTMLImageElement): Promise<boolean> => {
  try {
    // Obtener foto de perfil del usuario
    if (!authStore.user?.profilePhoto) {
      console.log('❌ No hay foto de perfil para comparar');
      return false;
    }
    
    // Crear imagen de perfil
    const profileImg = new Image();
    profileImg.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      profileImg.onload = async () => {
        try {
          // Comparar las dos imágenes usando face-api.js
          const similarity = await compareFaces(uploadedImg, profileImg);
          
          console.log('🔍 Similitud con foto de perfil:', similarity);
          
          // La similitud debe ser mayor a 0.6 para considerar que es la misma persona
          if (similarity > 0.6) {
            console.log('✅ Coincidencia con foto de perfil confirmada');
            resolve(true);
          } else {
            console.log('❌ No coincide con la foto de perfil');
            resolve(false);
          }
        } catch (error) {
          console.error('Error comparando fotos:', error);
          resolve(false);
        }
      };
      
      profileImg.onerror = () => {
        console.log('❌ Error cargando foto de perfil');
        resolve(false);
      };
      
      profileImg.src = authStore.user.profilePhoto;
    });
  } catch (error) {
    console.error('Error verificando coincidencia de perfil:', error);
    return false;
  }
};

// Detectar símbolo V con los dedos
const detectVSymbol = async (img: HTMLImageElement): Promise<boolean> => {
  try {
    // Crear canvas para procesar la imagen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Obtener datos de la imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Buscar patrones que indiquen dedos en V
    const hasVSymbol = detectHandGesture(imageData);
    
    if (hasVSymbol) {
      console.log('✅ Símbolo V detectado (manos detectadas)');
    } else {
      console.log('❌ No se detectaron manos en posición V');
    }
    
    return hasVSymbol;
  } catch (error) {
    console.error('Error detectando símbolo V:', error);
    return false;
  }
};

// Detectar gesto de mano (mejorado)
const detectHandGesture = (imageData: ImageData): boolean => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Buscar patrones de color que indiquen piel
  let skinPixels = 0;
  let totalPixels = 0;
  let handRegions = 0;
  
  // Dividir la imagen en regiones para detectar manos
  const regionSize = 50;
  const regions = [];
  
  for (let y = 0; y < height; y += regionSize) {
    for (let x = 0; x < width; x += regionSize) {
      let regionSkinPixels = 0;
      let regionTotalPixels = 0;
      
      // Analizar cada región
      for (let ry = y; ry < Math.min(y + regionSize, height); ry++) {
        for (let rx = x; rx < Math.min(x + regionSize, width); rx++) {
          const idx = (ry * width + rx) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // Detectar píxeles de piel (mejorado)
          if (isSkinPixel(r, g, b)) {
            skinPixels++;
            regionSkinPixels++;
          }
          totalPixels++;
          regionTotalPixels++;
        }
      }
      
      // Si una región tiene muchos píxeles de piel, es probable que sea una mano
      if (regionSkinPixels / regionTotalPixels > 0.3) {
        handRegions++;
      }
    }
  }
  
  const skinRatio = skinPixels / totalPixels;
  console.log('🔍 Ratio de piel detectada:', skinRatio);
  console.log('🔍 Regiones con manos detectadas:', handRegions);
  
  // Debe haber suficiente piel y al menos 2 regiones con manos (para el símbolo V)
  return skinRatio > 0.08 && handRegions >= 2;
};

// Función mejorada para detectar píxeles de piel
const isSkinPixel = (r: number, g: number, b: number): boolean => {
  // Detección de piel basada en rangos de color
  const isInSkinRange = r > 95 && g > 40 && b > 20;
  const hasGoodContrast = Math.max(r, g, b) - Math.min(r, g, b) > 15;
  const isRedDominant = Math.abs(r - g) > 15 && r > g && r > b;
  
  // Verificar que no es demasiado oscuro o claro
  const brightness = (r + g + b) / 3;
  const isGoodBrightness = brightness > 30 && brightness < 250;
  
  return isInSkinRange && hasGoodContrast && isRedDominant && isGoodBrightness;
};
</script>

<style scoped>
.photo-verification {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.verification-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.verification-step {
  text-align: center;
}

.verification-step h2 {
  color: #333;
  margin-bottom: 1rem;
}

.verification-step p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.instructions {
  text-align: left;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.instructions h3 {
  color: #333;
  margin-bottom: 1rem;
}

.instructions ol {
  padding-left: 1.5rem;
  color: #555;
}

.instructions li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.example-photo {
  margin: 2rem 0;
  padding: 2rem;
  background: #e8f5e9;
  border-radius: 12px;
  border: 2px dashed #4CAF50;
}

.example-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.example-photo p {
  color: #2e7d32;
  font-weight: 600;
  margin: 0;
}

.upload-container {
  margin: 2rem 0;
}

.upload-area {
  border: 3px dashed #4CAF50;
  border-radius: 12px;
  padding: 3rem 2rem;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: var(--wa-green);
  background: #e8f5e9;
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #4CAF50;
}

.upload-area p {
  color: #555;
  margin-bottom: 0.5rem;
}

.upload-hint {
  color: #777;
  font-size: 0.9rem;
  margin: 0;
}

.photo-review {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.uploaded-photo {
  width: 100%;
  height: auto;
  display: block;
}

.photo-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.v-symbol-check {
  font-size: 2rem;
  color: #4CAF50;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem;
  border-radius: 50%;
}

.upload-controls,
.review-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: var(--wa-green);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--wa-green-dark);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.btn-secondary:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.verification-success,
.verification-failed {
  text-align: center;
  padding: 2rem;
}

.success-icon,
.failed-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-icon {
  color: var(--wa-green);
}

.failed-icon {
  color: #f44336;
}

.verification-success h2 {
  color: var(--wa-green);
}

.verification-failed h2 {
  color: #f44336;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .verification-container {
    padding: 1rem;
  }
  
  .upload-controls,
  .review-controls,
  .result-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    max-width: 200px;
  }
}
</style> 