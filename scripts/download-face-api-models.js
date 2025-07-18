// Script para descargar los modelos de face-api
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '../public/models/face-api');

// Crear directorio si no existe
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log(`Directorio creado: ${modelsDir}`);
}

// Lista de modelos a descargar
const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// URL base para los modelos
const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

// Función para descargar un archivo
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Descargado: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Eliminar archivo parcial
      console.error(`Error descargando ${url}: ${err.message}`);
      reject(err);
    });
  });
}

// Descargar todos los modelos
async function downloadModels() {
  console.log('Iniciando descarga de modelos de face-api...');
  
  for (const model of models) {
    const url = baseUrl + model;
    const dest = path.join(modelsDir, model);
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`Error descargando ${model}: ${error}`);
    }
  }
  
  console.log('Descarga de modelos completada.');
}

downloadModels();