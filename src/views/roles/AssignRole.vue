<script setup>
import { useRolesStore } from '@/stores/rolesStore';
import { useUsersStore } from '@/stores/usersStore';
import { handleResponseToast } from '@/utils/response';
import { FilterMatchMode } from '@primevue/core/api';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';

const toast = useToast();
const isLoading = ref(false);

const rolesStore = useRolesStore();
const usersStore = useUsersStore();
const roles = ref([]);
const users = ref([]);
const filters = ref({});
const userDialog = ref(false);
const selectedUser = ref(null);
const selectedRole = ref(null);

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    if (!usersStore.getUsers) {
        await usersStore.fetchUsers();
    }
    if (!rolesStore.getRoles) {
        await rolesStore.fetchRoles();
    }
    roles.value = rolesStore.getRoles;
    users.value = usersStore.getUsers;
});

const editUser = (user) => {
    selectedUser.value = user;
    userDialog.value = true;
};

const saveUserRole = async () => {
    const roleName = roles.value.find((role) => role.id === selectedUser.value.role.id);
    const payload = {
        dni: selectedUser.value.dni,
        role_name: roleName.name
    };
    const success = await rolesStore.assignRole(payload);
    handleResponseToast(success, rolesStore.message, rolesStore.status, toast);
    userDialog.value = false;
    selectedUser.value = null;
    selectedRole.value = null;
};
</script>

<template>
    <div class="card">
        <h1 class="text-xl font-bold mb-3">Asignar Rol</h1>
        <DataTable
            ref="dt"
            :value="users"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :loading="rolesStore.loading || usersStore.loading"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} usuarios"
            :rowsPerPageOptions="[5, 10, 25]"
        >
            <Column field="name" header="Nombre"></Column>
            <Column field="role.name" header="Rol">
                <template #body="slotProps">
                    <span v-if="slotProps.data.role">{{ slotProps.data.role.name.toUpperCase() }}</span>
                    <span v-else>Sin asignar</span>
                </template>
            </Column>
            <Column :exportable="false" header="Acciones">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editUser(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
        <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" header="Asignar Rol" :modal="true">
            <div class="mb-3">
                <label for="role" class="block font-bold mb-1">Rol</label>
                <Select id="role" v-model="selectedUser.role.id" :options="roles" optionLabel="name" optionValue="id" placeholder="Seleccionar Rol" fluid />
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="userDialog = false" />
                <Button label="Guardar" severity="primary" @click="saveUserRole" :loading="rolesStore.loading" />
            </template>
        </Dialog>
    </div>
</template>
