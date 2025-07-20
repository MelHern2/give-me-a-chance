// Script para descargar los modelos de face-api
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URLs de los modelos de face-api.js (usando las URLs oficiales)
const MODELS = {
  'tiny_face_detector_model-shard1': 'https://justadudewhohacks.github.io/face-api.js/models/tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json': 'https://justadudewhohacks.github.io/face-api.js/models/tiny_face_detector_model-weights_manifest.json',
  'face_landmark_68_model-shard1': 'https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json': 'https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68_model-weights_manifest.json',
  'face_recognition_model-shard1': 'https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-shard1',
  'face_recognition_model-shard2': 'https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-shard2',
  'face_recognition_model-weights_manifest.json': 'https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-weights_manifest.json',
  'face_expression_model-shard1': 'https://justadudewhohacks.github.io/face-api.js/models/face_expression_model-shard1',
  'face_expression_model-weights_manifest.json': 'https://justadudewhohacks.github.io/face-api.js/models/face_expression_model-weights_manifest.json'
};

const MODELS_DIR = path.join(__dirname, '../public/models/face-api');

// Función para descargar un archivo
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Descargado: ${path.basename(filepath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Eliminar archivo parcial
      reject(err);
    });
    }).on('error', reject);
  });
}

// Función principal
async function downloadModels() {
  console.log('🚀 Iniciando descarga de modelos de face-api.js...');
  
  // Crear directorio si no existe
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log('📁 Creado directorio de modelos');
  }
  
  // Descargar todos los modelos
  for (const [filename, url] of Object.entries(MODELS)) {
    const filepath = path.join(MODELS_DIR, filename);
    
    try {
      await downloadFile(url, filepath);
    } catch (error) {
      console.error(`❌ Error descargando ${filename}:`, error.message);
    }
  }
  
  console.log('✅ Descarga de modelos completada');
}

// Ejecutar si se llama directamente
downloadModels().catch(console.error);