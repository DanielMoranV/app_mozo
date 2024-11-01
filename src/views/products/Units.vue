<script setup>
import { useProductsStore } from '@/stores/productsStore';
import { exportToExcel } from '@/utils/excelUtils';
import { capitalizeName, findIndexById } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import ExcelJS from 'exceljs';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';
//import { handleApiResponse } from '@/utils/response';

// Estado de carga
const isLoading = ref(false);
const loadingUnits = ref(false);

// Stores
const productsStore = useProductsStore();

const unit = ref(null);
const deleteUnitsDialog = ref(false);
const deleteUnitDialog = ref(false);
const units = ref(null);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const unitDialog = ref(false);
const selectedUnits = ref(null);

// Toast y Router
const toast = useToast();

const isFormValid = () => {
    return unit.value.name && unit.value.name.trim() && unit.value.symbol && unit.value.symbol.trim();
};
// Manejar entrada de nombre
const handleNameInput = () => {
    unit.value.name = capitalizeName(unit.value.name);
};

// Inicializar filtros
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

// Exportar a Excel
const exportExcel = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Simbolo', key: 'symbol', width: 30 }
    ];
    const data = units.value.map((unit) => ({
        name: unit.name,
        symbol: unit.symbol
    }));
    await exportToExcel(columns, data, 'unidades', 'unidades');
};

// Abrir diálogo de nuevo usuario
const openNew = () => {
    unit.value = {};
    submitted.value = false;
    unitDialog.value = true;
};

// Ocultar diálogo
const hideDialog = () => {
    unitDialog.value = false;
    submitted.value = false;
};

// Guardar usuario
const saveUnit = async () => {
    submitted.value = true;

    if (!isFormValid()) {
        return;
    }

    isLoading.value = true;
    loadingUnits.value = true;

    try {
        if (unit.value.id) {
            await updateUnit();
        } else {
            await createUnit();
        }

        unitDialog.value = false;
        unit.value = {};
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar unidad', life: 3000 });
    } finally {
        isLoading.value = false;
        loadingUnits.value = false;
    }
};

// Actualizar producto
const updateUnit = async () => {
    try {
        await productsStore.updateUnit(unit.value, unit.value.id);
        const unitIndex = findIndexById(unit.value.id, units.value);
        units.value[unitIndex] = unit.value;
        productsStore.updateListUnits(unit.value, unit.value.id);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Unidad actualizado', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: `Error al actualizar el unitdas: ${error.message}`, life: 3000 });
    }
};

// Crear producto
const createUnit = async () => {
    const response = await productsStore.createUnit(unit.value);

    if (response == '422') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Unidad ya registrado, error en validación', life: 3000 });
        isLoading.value = false;
        loadingUnits.value = false;
        unitDialog.value = false;
        unit.value = {};
        return;
    }

    unit.value = response;

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nueva unidad agregado', life: 3000 });
};

// Ciclos de vida del componente
onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    loadingUnits.value = true;
    units.value = productsStore.getUnits || (await productsStore.fetchUnits());
    loadingUnits.value = false;
});

// Editar producto
const editUnit = (editUnit) => {
    unit.value = { ...editUnit };
    unitDialog.value = true;
};

// Importar Datos Excel
const onUpload = async (event) => {
    const file = event.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(file);
            const worksheet = workbook.worksheets[0];
            const rows = worksheet.getSheetValues();

            // Procesar los datos del archivo
            const unitsData = rows.slice(2).map((row) => ({
                name: row[1],
                symbol: row[2]
            }));
            await uploadUnits(unitsData);
        } catch (error) {
            console.error('Error al procesar el archivo', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el archivo', life: 3000 });
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Formato de archivo no válido', life: 3000 });
    }
};

const uploadUnits = async (unitsData) => {
    loadingUnits.value = true;
    try {
        // Enviar los datos al backend
        const response = await productsStore.uploadUnits(unitsData);
        units.value = await productsStore.fetchUnits();
        if (response.success.length > 0) {
            response.success.length;
            toast.add({ severity: 'success', summary: 'Éxito', detail: response.success.length + ' Datos importados correctamente', life: 3000 });
        }
        if (response.errors.length > 0) {
            response.success.length;
            toast.add({ severity: 'error', summary: 'Éxito', detail: response.errors.length + ' Datos importados incorrectamente', life: 3000 });
        }
    } catch (error) {
        console.log(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al importar los datos', life: 3000 });
    } finally {
        loadingUnits.value = false;
    }
};

// Confirmar eliminación de usuario
const confirmDeleteUnit = (unitDeleted) => {
    unit.value = unitDeleted;
    deleteUnitDialog.value = true;
};

// Eliminar producto
const deleteUnit = async () => {
    isLoading.value = true;
    const response = await productsStore.deleteUnit(unit.value.id);
    if (response.success == true) {
        units.value = units.value.filter((val) => val.id !== unit.value.id);
        deleteUnitDialog.value = false;
        unit.value = {};
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoria Eliminado', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al elimar Categoria', life: 3000 });
    }
    isLoading.value = true;
};

// Confirmar eliminacion
const confirmDeleteSelected = () => {
    deleteUnitsDialog.value = true;
};
// Eliminar Categoria
const deleteSelectedUnits = async () => {
    isLoading.value = true;
    const selectedUnitsIds = selectedUnits.value.map((unit) => unit.id);
    const successfulDeletes = [];
    const failedDeletes = [];

    for (const id of selectedUnitsIds) {
        try {
            const response = await productsStore.deleteUnit(id);
            if (response) {
                successfulDeletes.push(id);
            } else {
                failedDeletes.push(id);
            }
        } catch (error) {
            failedDeletes.push(id);
        }
    }

    // Filtrar la lista de usuarios en el frontend
    units.value = units.value.filter((val) => !successfulDeletes.includes(val.id));
    deleteUnitsDialog.value = false;
    selectedUnits.value = null;

    if (failedDeletes.length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: failedDeletes.length + ' productos no pudieron ser eliminados', life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categorias Eliminados', life: 3000 });
    }
    isLoading.value = false;
};
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedUnits || !selectedUnits.length" />
            </template>

            <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template>
        </Toolbar>
        <DataTable
            ref="dt"
            :value="units"
            v-model:selection="selectedUnits"
            dataKey="id"
            :paginator="true"
            :loading="loadingUnits"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} productos"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Categorias</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="Id" :sortable="true" headerStyle="width:10%; min-width:8rem;"> </Column>
            <Column field="name" header="Nombre" :sortable="true" headerStyle="width:25%; min-width:10rem;"> </Column>
            <Column field="symbol" header="Símbolo" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>

            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editUnit(slotProps.data)" />
                    <Button icon="pi pi-trash" class="mt-2" severity="warn" rounded @click="confirmDeleteUnit(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="unitDialog" :style="{ width: '450px' }" header="Detalle de Usuario" :modal="true">
            <div class="mb-3">
                <label for="name" class="block font-bold mb-1">Nombre</label>
                <InputText id="name" v-model.trim="unit.name" @input="handleNameInput" required autofocus :invalid="submitted && !unit.name" fluid />
                <small class="text-red-500" v-if="submitted && !unit.name">Nombre es requerido.</small>
            </div>
            <div class="mb-3">
                <label for="symbol" class="block font-bold mb-1">Símbolo</label>
                <InputText id="symbol" v-model.trim="unit.symbol" @input="handleNameInput" required autofocus :invalid="submitted && !unit.name" fluid />
                <small class="text-red-500" v-if="submitted && !unit.name">Símbolo es requerido.</small>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveUnit" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteUnitDialog" :style="{ width: '450px' }" header="Confirmar Eliminación" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="unit"
                    >Estás seguro de que quieres eliminar <b>{{ unit.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUnitDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteUnit" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUnitsDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="units">¿Está seguro de que desea eliminar los productos seleccionados</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUnitsDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteSelectedUnits" />
            </template>
        </Dialog>
    </div>
</template>
