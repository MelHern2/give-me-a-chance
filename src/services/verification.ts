import * as faceapi from '@vladmandic/face-api';
import { ref } from 'vue';

// Estado de carga de modelos
const modelsLoaded = ref(false);

// Función para cargar los modelos de face-api.js
export const loadFaceModels = async () => {
  if (modelsLoaded.value) return;
  
  try {
    // Ruta a los modelos
    const MODEL_URL = '/models/face-api';
    
    // Cargar modelos necesarios
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded.value = true;
    console.log('✅ Modelos de face-api.js cargados correctamente');
  } catch (error) {
    console.error('❌ Error cargando modelos de face-api.js:', error);
    throw new Error('No se pudieron cargar los modelos de reconocimiento facial');
  }
};

// Función para detectar rostro en una imagen
export const detectFace = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<faceapi.FaceDetection | null> => {
  if (!modelsLoaded.value) {
    await loadFaceModels();
  }
  
  try {
    // Detectar rostros en la imagen
    const detections = await faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();
    
    if (detections.length === 0) {
      return null;
    }
    
    return detections[0].detection;
  } catch (error) {
    console.error('Error detectando rostro:', error);
    return null;
  }
};

// Interfaz para el resultado de la verificación de vida
export interface LivenessResult {
  isLive: boolean;
  score: number;
  actions: string[];
  completed: boolean;
}

// Estado de la verificación de vida
const livenessState = ref<LivenessResult>({
  isLive: false,
  score: 0,
  actions: [],
  completed: false
});

// Acciones para la verificación de vida
const LIVENESS_ACTIONS = ['blink', 'smile', 'turn_head_left', 'turn_head_right'];

// Función para iniciar la verificación de vida
export const startLivenessCheck = () => {
  livenessState.value = {
    isLive: false,
    score: 0,
    actions: getRandomActions(2), // Seleccionar 2 acciones aleatorias
    completed: false
  };
  
  return livenessState.value.actions;
};

// Función para obtener acciones aleatorias
const getRandomActions = (count: number): string[] => {
  const shuffled = [...LIVENESS_ACTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Función para verificar una acción específica
export const verifyLivenessAction = async (
  videoElement: HTMLVideoElement,
  action: string
): Promise<boolean> => {
  if (!modelsLoaded.value) {
    await loadFaceModels();
  }
  
  try {
    // Detectar rostro con landmarks y expresiones
    const detection = await faceapi.detectSingleFace(
      videoElement,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();
    
    if (!detection) return false;
    
    switch (action) {
      case 'blink':
        // Verificar si los ojos están cerrados (baja distancia entre párpados)
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        // Calcular apertura de ojos
        const leftEyeOpen = getEyeOpen(leftEye);
        const rightEyeOpen = getEyeOpen(rightEye);
        
        return leftEyeOpen < 0.2 && rightEyeOpen < 0.2;
        
      case 'smile':
        // Verificar expresión de felicidad
        return detection.expressions.happy > 0.7;
        
      case 'turn_head_left':
        // Verificar rotación de cabeza a la izquierda
        const jawLeft = detection.landmarks.getJawOutline();
        return isHeadTurned(jawLeft, 'left');
        
      case 'turn_head_right':
        // Verificar rotación de cabeza a la derecha
        const jawRight = detection.landmarks.getJawOutline();
        return isHeadTurned(jawRight, 'right');
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Error verificando acción de vida:', error);
    return false;
  }
};

// Función auxiliar para calcular apertura de ojo
const getEyeOpen = (eye: faceapi.Point[]): number => {
  // Simplificado: distancia vertical entre párpados / distancia horizontal del ojo
  const eyeHeight = Math.abs(eye[1].y - eye[5].y);
  const eyeWidth = Math.abs(eye[0].x - eye[3].x);
  return eyeHeight / eyeWidth;
};

// Función auxiliar para verificar giro de cabeza
const isHeadTurned = (jawPoints: faceapi.Point[], direction: 'left' | 'right'): boolean => {
  // Simplificado: comparar posiciones relativas de puntos de la mandíbula
  const jawLeft = jawPoints[0];
  const jawRight = jawPoints[jawPoints.length - 1];
  const jawCenter = jawPoints[Math.floor(jawPoints.length / 2)];
  
  if (direction === 'left') {
    return (jawRight.x - jawCenter.x) > 2 * (jawCenter.x - jawLeft.x);
  } else {
    return (jawCenter.x - jawLeft.x) > 2 * (jawRight.x - jawCenter.x);
  }
};

// Función para completar la verificación de vida
export const completeLivenessCheck = (success: boolean, score: number = 0) => {
  livenessState.value.isLive = success;
  livenessState.value.score = score;
  livenessState.value.completed = true;
  
  return livenessState.value;
};

// Función para comparar dos rostros
export const compareFaces = async (
  faceImage1: HTMLImageElement | HTMLVideoElement,
  faceImage2: HTMLImageElement | HTMLVideoElement
): Promise<number> => {
  if (!modelsLoaded.value) {
    await loadFaceModels();
  }
  
  try {
    // Obtener descriptores faciales
    const descriptor1 = await getFaceDescriptor(faceImage1);
    const descriptor2 = await getFaceDescriptor(faceImage2);
    
    if (!descriptor1 || !descriptor2) {
      return 0;
    }
    
    // Calcular distancia euclidiana (menor distancia = mayor similitud)
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    
    // Convertir distancia a similitud (0-1)
    // Valores típicos: <0.4 = mismo rostro, >0.6 = rostro diferente
    const similarity = Math.max(0, 1 - distance);
    
    return similarity;
  } catch (error) {
    console.error('Error comparando rostros:', error);
    return 0;
  }
};

// Función auxiliar para obtener descriptor facial
const getFaceDescriptor = async (
  image: HTMLImageElement | HTMLVideoElement
): Promise<Float32Array | null> => {
  try {
    const detection = await faceapi.detectSingleFace(
      image,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptor();
    
    return detection?.descriptor || null;
  } catch (error) {
    console.error('Error obteniendo descriptor facial:', error);
    return null;
  }
};

// Exportar estado
export const useVerification = () => {
  return {
    modelsLoaded,
    livenessState
  };
};