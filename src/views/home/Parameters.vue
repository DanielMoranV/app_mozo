<script setup>
import { useParametersStore } from '@/stores/parametersStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';

const parametersStore = useParametersStore();
const warehousesStore = useWarehousesStore();

const parameters = ref([]);
const parameter = ref([]);
const filters = ref({});
const warehouses = ref({});

const userDialog = ref(false);
const dt = ref(null);

const toast = useToast();

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
const editUser = (editUser) => {
    parameter.value = { ...editUser };
    userDialog.value = true;
};
const hideDialog = () => {
    userDialog.value = false;
};

const saveUser = async () => {};

onBeforeMount(() => {
    initFilters();
});
onMounted(async () => {
    parameters.value = parametersStore.getParameter || (await parametersStore.fetchParameters());

    warehouses.value = warehousesStore.getWarehousesCbx || (await warehousesStore.fetchWarehousesCbx());
});
</script>

<template>
    <div class="card">
        <!-- <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCategories || !selectedCategories.length" />
            </template>
            <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template>
        </Toolbar> -->
        <DataTable
            ref="dt"
            :value="parameters"
            dataKey="id"
            :paginator="true"
            :loading="parametersStore.isLoading"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} categorías"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Parametros de negocio</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column field="id" header="Id" :sortable="true" headerStyle="width:10%; min-width:8rem;"> </Column>
            <Column field="user.name" header="Usuario" :sortable="true"> </Column>
            <Column field="warehouse.name" header="Almacén" :sortable="true"> </Column>
            <Column field="company.company_name" header="Empresa" :sortable="true"> </Column>
            <Column field="sunat_send" header="Envio SUNAT" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    <ToggleSwitch v-model="slotProps.data.sunat_send" />
                </template>
            </Column>
            <Column field="locked" header="Bloqueado" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    <ToggleSwitch v-model="slotProps.data.locked" />
                </template>
            </Column>
            <!-- <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editUser(slotProps.data)" />
                </template>
            </Column> -->
        </DataTable>

        <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" header="Detalle de Usuario" :modal="true">
            <div class="mb-3">
                <label for="name" class="block font-bold mb-1">Nombre</label>
                <InputText id="name" v-model.trim="parameter.user.name" required autofocus fluid disabled />
            </div>
            <div class="mb-3">
                <label for="warehouse" class="block font-bold mb-1">Almacén</label>
                <Select id="warehouse" v-model="parameter.warehouse.id" :options="warehouses" optionValue="value" optionLabel="label" placeholder="Selecciona Almacén" fluid></Select>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveUser" />
            </template>
        </Dialog>
    </div>
</template>
