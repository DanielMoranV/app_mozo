<script setup>
import { useRolesStore } from '@/stores/rolesStore';
import { handleResponseToast } from '@/utils/response';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';

const rolesStore = useRolesStore();
const roles = ref([]);
const toast = useToast();
const loading = ref(false);
const isLoading = ref(false);
const roleDialog = ref(false);
const role = ref(null);
const submitted = ref(false);
const selectedRoles = ref([]);
const deleteRoleDialog = ref(false);

const filters = ref({});

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

onMounted(async () => {
    if (!rolesStore.getRoles) {
        await rolesStore.fetchRoles();
    }
    roles.value = rolesStore.getRoles;
});

const openNew = () => {
    roleDialog.value = true;
    submitted.value = false;
    role.value = {
        id: null,
        name: null
    };
};

const hideDialog = () => {
    roleDialog.value = false;
    submitted.value = false;
};

const isFormValid = () => {
    return role.value.name && role.value.name.trim();
};

const saveRole = async () => {
    submitted.value = true;

    if (!isFormValid()) {
        return;
    }

    isLoading.value = true;

    const action = role.value.id ? updateRole : createRole;
    await action();

    roleDialog.value = false;
    role.value = {};
    isLoading.value = false;
};

const updateRole = async () => {
    const success = await rolesStore.updateRole(role.value, role.value.id);
    handleResponseToast(success, rolesStore.message, rolesStore.status, toast);
    if (success) {
        const roleIndex = roles.value.findIndex((r) => r.id === role.value.id);
        roles.value[roleIndex] = rolesStore.role;
    }
};

const createRole = async () => {
    const success = await rolesStore.createRole(role.value);
    handleResponseToast(success, rolesStore.message, rolesStore.status, toast);
    roleDialog.value = false;
    role.value = {};
};

const editRole = (data) => {
    role.value = { ...data };
    roleDialog.value = true;
};

const confirmDeleteRole = (data) => {
    role.value = { ...data };
    deleteRoleDialog.value = true;
};

const deleteRole = async () => {
    isLoading.value = true;
    const success = await rolesStore.deleteRole(role.value.id);
    handleResponseToast(success, rolesStore.message, rolesStore.status, toast);
    if (success) {
        roles.value = roles.value.filter((r) => r.id !== role.value.id);
        deleteRoleDialog.value = false;
        role.value = {};
    }
    isLoading.value = false;
};

onBeforeMount(() => {
    initFilters();
});
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
            </template>
        </Toolbar>
        <DataTable :value="roles" :loading="rolesStore.loading" :filters="filters" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50]" dataKey="id" :selection="selectedRoles">
            <Column field="id" header="ID" />
            <Column field="name" header="Nombre">
                <template #body="{ data }">
                    {{ data.name.toUpperCase() }}
                </template>
            </Column>
            <Column field="created_at" header="Creado">
                <template #body="{ data }">
                    {{ new Date(data.created_at).toLocaleDateString() }}
                </template>
            </Column>
            <Column header="Acciones" bodyClass="text-center" :exportable="false">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editRole(data)" />
                    <Button icon="pi pi-trash" class="mt-2" severity="warn" rounded @click="confirmDeleteRole(data)" />
                </template>
            </Column>
        </DataTable>
        <Dialog v-model:visible="roleDialog" :style="{ width: '450px' }" header="Detalle de Rol" :modal="true">
            <div class="mb-3">
                <label for="name" class="block font-bold mb-1">Nombre</label>
                <InputText id="name" v-model.trim="role.name" required autofocus :invalid="submitted && !role.name" fluid />
                <small class="text-red-500" v-if="submitted && !role.name">Nombre es requerido.</small>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveRole" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteRoleDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="role"
                    >¿Estás seguro de que quieres eliminar el rol <b>{{ role.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteRoleDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteRole" :loading="isLoading" />
            </template>
        </Dialog>
    </div>
</template>

<style></style>
