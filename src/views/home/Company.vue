<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { handleApiResponse } from '@/utils/response';
import { capitalizeName, restrictToNumbers, validateEmail, validatePhone, validateRUC } from '@/utils/validationUtils';

const api_url = import.meta.env.VITE_API_URL;
const storage_url = import.meta.env.VITE_STORAGE_URL;

// Stores
const authStore = useAuthStore();
const companiesStore = useCompaniesStore();

// Referencias y datos
const company = ref({
    ruc: '',
    email: '',
    logo_path: '',
    phone: ''
});
const urlPhotoProfile = ref('');
const isLoading = ref(false);

// Estados de validación
const isRUCValid = ref(true);
const isEmailValid = ref(true);
const isPhoneValid = ref(true);

// Toast y Router
const toast = useToast();
const router = useRouter();

// Validar campos
const validateFields = () => {
    validateRUCField();
    validateEmailField();
    validatePhoneField();
};

// Verificar si el formulario es válido
const isFormValid = () => {
    return company.value.company_name && company.value.company_name.trim() && company.value.email && isRUCValid.value && isEmailValid.value && isPhoneValid.value;
};

// Manejar entrada de nombre
const handleNameInput = () => {
    company.value.company_name = capitalizeName(company.value.company_name);
};

// Validar DNI
const validateRUCField = () => {
    isRUCValid.value = validateRUC(company.value.ruc);
};

// Validar email
const validateEmailField = () => {
    isEmailValid.value = validateEmail(company.value.email);
};

// Validar teléfono
const validatePhoneField = () => {
    isPhoneValid.value = validatePhone(company.value.phone);
};

// Actualizar usuario
const updateCompany = async () => {
    isLoading.value = true;
    validateFields();

    if (!isFormValid()) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, complete todos los campos requeridos', life: 3000 });
        isLoading.value = false;
        return;
    }

    const payload = {
        id: company.value.id,
        company_name: company.value.company_name,
        ruc: company.value.ruc,
        address: company.value.address,
        email: company.value.email,
        phone: company.value.phone
    };

    try {
        const response = await companiesStore.updateCompany(payload, company.value.id);
        authStore.updateUser(payload);
        handleApiResponse(response, toast);
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar usuario:', life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

// Manejar carga de foto de perfil
const beforeUpload = (request) => {
    request.xhr.setRequestHeader('Authorization', 'Bearer ' + authStore.getToken);
    return request;
};

const onUpload = async (request) => {
    try {
        const response = typeof request.xhr.response === 'string' ? JSON.parse(request.xhr.response) : request.xhr.response;
        const urlPhotoProfile = response.data.logo_path;
        company.value.logo_path = storage_url + urlPhotoProfile;
        const payload = {
            company: {
                ...company.value
            }
        };
        authStore.updateUser(payload);
        toast.add({ severity: 'success', summary: 'Foto de perfil actualizada correctamente', life: 4000 });
    } catch (error) {
        console.error('Error al procesar la respuesta', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la respuesta', life: 3000 });
    }
};

// Cargar datos del usuario
onMounted(() => {
    const user = authStore.getUser;
    company.value = user.company;
    const defaultProfile = '/images/profile.png';

    const logoPath = company.value.logo_path ?? defaultProfile;

    // Si el perfil no contiene la URL de almacenamiento y no es la imagen predeterminada
    if (logoPath !== defaultProfile && !logoPath.includes(storage_url)) {
        company.value.logo_path = `${storage_url}${logoPath}`;
    } else {
        company.value.logo_path = logoPath;
    }
    urlPhotoProfile.value = api_url + '/companies/' + company.value.id + '/logo';
});

// Watchers
watch(() => company.value.ruc, validateRUCField);
watch(() => company.value.email, validateEmailField);
watch(() => company.value.phone, validatePhoneField);
</script>

<template>
    <div class="profile-header mb-3">
        <Avatar :image="company.logo_path" size="xlarge" shape="circle" class="mr-3" />
        <div>
            <h2>{{ company.company_name }}</h2>
            <p>{{ company.ruc }}</p>
        </div>
    </div>
    <div class="card">
        <div class="flex flex-col md:flex-row">
            <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-3 py-5">
                <div class="flex flex-col gap-2 w-full">
                    <label for="name">Nombre</label>
                    <InputText id="name" v-model="company.company_name" @input="handleNameInput" />
                </div>
                <div class="flex flex-col gap-2 w-full">
                    <label for="dni">RUC</label>
                    <InputText id="dni" v-model="company.ruc" @input="validateRUCField" @keypress="restrictToNumbers" maxlength="11" />
                </div>
                <div class="flex flex-col gap-2 w-full">
                    <label for="address">Dirección</label>
                    <InputText id="address" v-model="company.address" />
                </div>
                <div class="flex flex-col gap-2 w-full">
                    <label for="email">Email</label>
                    <InputText id="email" v-model="company.email" />
                </div>
                <div class="flex flex-col gap-2 w-full">
                    <label for="phone">Teléfono</label>
                    <InputText id="phone" v-model="company.phone" />
                </div>
                <div class="flex w-full">
                    <Button label="Actualizar" icon="pi pi-pencil" class="w-full mx-auto" @click="updateCompany" :loading="isLoading" />
                </div>
            </div>
            <div class="w-full md:w-2/12">
                <Divider layout="vertical" class="hidden md:flex"></Divider>
            </div>
            <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-3 py-5">
                <div class="flex flex-col gap-2 w-full">
                    <FileUpload name="logo" :url="urlPhotoProfile" @before-send="beforeUpload" mode="basic" accept="image/*" :maxFileSize="1000000" :auto="true" chooseLabel="Logo de Empresa" class="w-full mx-auto" @upload="onUpload" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-header {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: var(--primary-color);
    border-radius: 5px 5px 5px 5px;
}
.profile-header h2 {
    margin: 0;
    color: white;
}
.profile-header p {
    margin: 0;
    color: white;
}
</style>
