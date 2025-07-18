<template>
  <div class="register-form">
    <h2>Registro</h2>
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email"
          v-model="form.email" 
          type="email" 
          required 
          placeholder="tu@email.com"
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input 
          id="password"
          v-model="form.password" 
          type="password" 
          required 
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div class="form-group">
        <label for="name">Nombre</label>
        <input 
          id="name"
          v-model="form.name" 
          type="text" 
          required 
          placeholder="Tu nombre"
        />
      </div>

      <div class="form-group">
        <label for="age">Edad</label>
        <input 
          id="age"
          v-model.number="form.age" 
          type="number" 
          min="18" 
          max="100" 
          required
        />
      </div>

      <div class="form-group">
        <label for="gender">Género</label>
        <select id="gender" v-model="form.gender" required>
          <option value="">Selecciona tu género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="no-binario">No binario</option>
          <option value="otro">Otro</option>
          <option value="prefiero-no-decirlo">Prefiero no decirlo</option>
        </select>
      </div>

      <div class="form-group">
        <label for="country">País</label>
        <input 
          id="country"
          v-model="form.country" 
          type="text" 
          required 
          placeholder="Tu país"
        />
      </div>

      <div class="form-group">
        <label for="region">Región/Estado</label>
        <input 
          id="region"
          v-model="form.region" 
          type="text" 
          required 
          placeholder="Tu región o estado"
        />
      </div>

      <div class="form-group">
        <label for="city">Ciudad</label>
        <input 
          id="city"
          v-model="form.city" 
          type="text" 
          required 
          placeholder="Tu ciudad"
        />
      </div>

      <div class="form-group">
        <label for="religion">Religión</label>
        <select id="religion" v-model="form.religion" required>
          <option value="">Selecciona una opción</option>
          <option value="catolica">Católica</option>
          <option value="protestante">Protestante</option>
          <option value="musulmana">Musulmana</option>
          <option value="judia">Judía</option>
          <option value="budista">Budista</option>
          <option value="hindu">Hindú</option>
          <option value="ateo">Ateo/Agnóstico</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div class="form-group">
        <label>¿Eres monógamo/a?</label>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="form.isMonogamous" :value="true" />
            Sí
          </label>
          <label>
            <input type="radio" v-model="form.isMonogamous" :value="false" />
            No
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="sexualOrientation">Orientación Sexual</label>
        <select id="sexualOrientation" v-model="form.sexualOrientation" required>
          <option value="">Selecciona una opción</option>
          <option value="heterosexual">Heterosexual</option>
          <option value="homosexual">Homosexual</option>
          <option value="bisexual">Bisexual</option>
          <option value="pansexual">Pansexual</option>
          <option value="asexual">Asexual</option>
        </select>
      </div>

      <div class="form-group">
        <label for="politicalOrientation">Orientación Política</label>
        <select id="politicalOrientation" v-model="form.politicalOrientation" required>
          <option value="">Selecciona una opción</option>
          <option value="izquierda">Izquierda</option>
          <option value="centro-izquierda">Centro-izquierda</option>
          <option value="centro">Centro</option>
          <option value="centro-derecha">Centro-derecha</option>
          <option value="derecha">Derecha</option>
          <option value="apolitico">Apolítico</option>
        </select>
      </div>

      <div class="form-group">
        <label>¿Tienes hijos?</label>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="form.hasChildren" :value="true" />
            Sí
          </label>
          <label>
            <input type="radio" v-model="form.hasChildren" :value="false" />
            No
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="relationshipType">Tipo de relación que buscas</label>
        <select id="relationshipType" v-model="form.relationshipType" required>
          <option value="">Selecciona una opción</option>
          <option value="seria">Relación seria</option>
          <option value="casual">Relación casual</option>
          <option value="amistad">Amistad</option>
          <option value="matrimonio">Matrimonio</option>
          <option value="poliamor">Poliamor</option>
        </select>
      </div>

      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea 
          id="description"
          v-model="form.description" 
          rows="4" 
          placeholder="Cuéntanos sobre ti..."
          required
        ></textarea>
      </div>

      <div class="form-group">
        <label>Fotos</label>
        <div class="photo-upload">
          <input 
            type="file" 
            @change="handlePhotoUpload" 
            accept="image/*" 
            multiple
            ref="photoInput"
          />
          <div class="photo-preview" v-if="form.photos.length > 0">
            <div v-for="(photo, index) in form.photos" :key="index" class="photo-item">
              <img :src="photo" alt="Preview" />
              <button type="button" @click="removePhoto(index)" class="remove-btn">×</button>
            </div>
          </div>
        </div>
      </div>

      <button type="submit" :disabled="loading" class="submit-btn">
        {{ loading ? 'Registrando...' : 'Registrarse' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { uploadImageToImageKit } from '@/services/imagekit';
import { registerUser } from '@/services/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const form = reactive({
  email: '',
  password: '',
  name: '',
  age: 18,
  gender: '', // Nuevo campo
  country: '',
  region: '',
  city: '',
  religion: '',
  isMonogamous: true,
  sexualOrientation: '',
  politicalOrientation: '',
  hasChildren: false,
  relationshipType: '',
  description: '',
  photos: [] as string[],
  // isAdmin no se pide en el registro, pero se fuerza a false
});

const handlePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files) {
    for (const file of Array.from(files)) {
      if (form.photos.length >= 6) break;
      
      try {
        loading.value = true;
        const imageUrl = await uploadImageToImageKit(file);
        form.photos.push(imageUrl);
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Error al subir la foto. Inténtalo de nuevo.');
      } finally {
        loading.value = false;
      }
    }
  }
};

const removePhoto = (index: number) => {
  form.photos.splice(index, 1);
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    // Validar que se haya subido al menos una foto
    if (form.photos.length === 0) {
      alert('Por favor sube al menos una foto');
      return;
    }

    // Crear objeto de usuario para Firebase
    const userData = {
      name: form.name,
      age: form.age,
      gender: form.gender, // Nuevo campo
      country: form.country,
      region: form.region,
      city: form.city,
      religion: form.religion,
      isMonogamous: form.isMonogamous,
      sexualOrientation: form.sexualOrientation,
      politicalOrientation: form.politicalOrientation,
      hasChildren: form.hasChildren,
      relationshipType: form.relationshipType,
      description: form.description,
      photos: form.photos,
      location: {
        latitude: 0, // Se actualizará cuando implementemos geolocalización
        longitude: 0,
      },
      isAdmin: false, // Siempre false al registrar
    };

    // Registrar usuario en Firebase
    const user = await registerUser(form.email, form.password, userData);
    
    // Actualizar el store
    authStore.setUser(user);
    authStore.saveUserToStorage(user);
    
    // Redirigir a términos (los nuevos usuarios siempre deben aceptar)
    router.push('/terms');
    
  } catch (error: any) {
    console.error('Error en el registro:', error);
    let errorMessage = 'Error en el registro';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    alert(errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 600;
  color: var(--wa-green);
}

input, select, textarea {
  padding: 12px;
  border: 1px solid var(--wa-gray);
  border-radius: 2rem;
  font-size: 16px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}

.photo-upload {
  border: 2px dashed var(--wa-gray);
  padding: 20px;
  border-radius: var(--wa-radius);
  text-align: center;
}

.photo-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.photo-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--wa-radius);
}

.remove-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--wa-danger);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.submit-btn {
  background: var(--wa-green);
  color: white;
  padding: 15px;
  border: none;
  border-radius: 2rem;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: var(--wa-green-dark);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style> 