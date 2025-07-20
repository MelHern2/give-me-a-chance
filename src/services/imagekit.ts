export interface ImageUploadResponse {
  url: string;
  path: string;
}

// Convertir archivo a Base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Comprimir imagen para reducir tamaño
const compressImage = (file: File, maxWidth: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convertir a blob
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback al archivo original
        }
      }, 'image/jpeg', 0.8); // Calidad 80%
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImageToImageKit = async (file: File): Promise<string> => {
  try {
    console.log('📤 Iniciando procesamiento de imagen...');
    
    // Comprimir imagen si es muy grande
    let processedFile = file;
    if (file.size > 1024 * 1024) { // Si es mayor a 1MB
      console.log('🔄 Comprimiendo imagen...');
      processedFile = await compressImage(file);
      console.log('✅ Imagen comprimida');
    }
    
    // Convertir a Base64
    console.log('🔄 Convirtiendo a Base64...');
    const base64Data = await convertFileToBase64(processedFile);
    console.log('✅ Imagen convertida a Base64');

    return base64Data;
  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    throw new Error('Error al procesar la imagen. Inténtalo de nuevo.');
  }
};

// Función auxiliar para obtener URL de imagen (mantener compatibilidad)
export const getImageKitUrl = (filePath: string): string => {
  return filePath; // Base64 ya es la URL completa
}; 