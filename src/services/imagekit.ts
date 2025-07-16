import axios from 'axios';

// Configuración de ImageKit
const IMAGEKIT_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_PUBLIC_KEY = 'public_KoFPHuSF5OiuarsOdzPfczHX1ik='; // Tu public key
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/ppimw7trl'; // Tu endpoint

export interface ImageKitResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
  filePath: string;
  fileType: string;
}

export const uploadImageToImageKit = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', `dating-app-${Date.now()}-${file.name}`);
    formData.append('folder', 'dating-app'); // Opcional: organizar en carpetas

    // Autenticación: Basic base64(publicKey:)
    const auth = btoa(`${IMAGEKIT_PUBLIC_KEY}:`);

    const response = await axios.post<ImageKitResponse>(IMAGEKIT_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Basic ${auth}`,
      },
    });

    return response.data.url; // Retorna la URL pública de la imagen
  } catch (error) {
    console.error('Error uploading image to ImageKit:', error);
    throw new Error('Failed to upload image');
  }
};

export const getImageKitUrl = (filePath: string): string => {
  return `${IMAGEKIT_URL_ENDPOINT}/${filePath}`;
}; 