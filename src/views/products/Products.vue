<script setup>
import { useAuthStore } from '@/stores/authStore';
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
const loadingProducts = ref(false);

// Stores
const productsStore = useProductsStore();
const authStore = useAuthStore();

const products = ref(null);
const product = ref(null);
const deleteProductsDialog = ref(false);
const deleteProductDialog = ref(false);
const categories = ref(null);
const user = ref(null);
const units = ref(null);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const productDialog = ref(false);
const selectedProducts = ref(null);

// Toast y Router
const toast = useToast();

const isFormValid = () => {
    return product.value.name && product.value.name.trim() && product.value.code && product.value.code.trim();
};
// Manejar entrada de nombre
const handleNameInput = () => {
    product.value.name = capitalizeName(product.value.name);
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
        { header: 'Código', key: 'code', width: 15 },
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Descripción', key: 'description', width: 30 },
        { header: 'Categoría', key: 'category', width: 30 },
        { header: 'Unidad', key: 'unit', width: 15 }
    ];
    const data = products.value.map((product) => ({
        code: product.code,
        name: product.name,
        description: product.description,
        category: product.category.name,
        unit: product.unit.symbol.toUpperCase()
    }));
    await exportToExcel(columns, data, 'productos', 'productos');
};

// Abrir diálogo de nuevo usuario
const openNew = () => {
    product.value = {
        category: {
            id: 1
        },
        unit: {
            id: 1
        }
    };
    submitted.value = false;
    productDialog.value = true;
};

// Ocultar diálogo
const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false;
};

// Guardar usuario
const saveProduct = async () => {
    submitted.value = true;

    if (!isFormValid()) {
        return;
    }

    isLoading.value = true;
    loadingProducts.value = true;

    try {
        const categoryIndex = categories.value.findIndex((item) => item.value === product.value.category.id);
        const unitIndex = units.value.findIndex((item) => item.value === product.value.unit.id);
        product.value.category.name = categories.value[categoryIndex].label;
        product.value.unit.name = units.value[unitIndex].label;
        if (product.value.id) {
            await updateProduct();
        } else {
            await createProduct();
        }

        productDialog.value = false;
        product.value = {};
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar usuario', life: 3000 });
    } finally {
        isLoading.value = false;
        loadingProducts.value = false;
    }
};

// Actualizar producto
const updateProduct = async () => {
    try {
        await productsStore.updateProduct(product.value, product.value.id);

        const productIndex = findIndexById(product.value.id, products.value);

        products.value[productIndex] = product.value;

        productsStore.updateListProducts(product.value, product.value.id);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Productos actualizado', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: `Error al actualizar el producto: ${error.message}`, life: 3000 });
    }
};

// Crear producto
const createProduct = async () => {
    product.value.user_id = user.value.id;
    product.value.user = {
        id: user.value.id,
        name: user.value.name
    };
    const response = await productsStore.createProduct(product.value);

    if (response == 422 || response == 500) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Producto ya registrado, error en validación', life: 3000 });
        isLoading.value = false;
        loadingProducts.value = false;
        productDialog.value = false;
        product.value = {};
        return;
    }

    product.value = response;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nuevo producto agregado', life: 3000 });
};

// Ciclos de vida del componente
onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    loadingProducts.value = true;
    products.value = productsStore.getProducts || (await productsStore.fetchProducts());

    categories.value = productsStore.getCategoriesCbx || (await productsStore.fetchCategoriesComboBox());

    units.value = productsStore.getUnitsCbx || (await productsStore.fetchUnitsComboBox());

    const data = authStore.getUser;
    user.value = {
        id: data.id,
        name: data.name
    };
    loadingProducts.value = false;
});

// Editar producto
const editProduct = (editProduct) => {
    product.value = { ...editProduct };
    productDialog.value = true;
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
            const productsData = rows.slice(2).map((row) => ({
                code: row[1],
                name: row[2],
                description: row[3] ? row[3] : null,
                category_id: categories.value.find((category) => category.label === row[4])?.value || null,
                unit_id: units.value.find((unit) => unit.label.toUpperCase() === row[5].toUpperCase())?.value || null,
                user_id: user.value.id
            }));
            await uploadProducts(productsData);
        } catch (error) {
            console.error('Error al procesar el archivo', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el archivo', life: 3000 });
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Formato de archivo no válido', life: 3000 });
    }
};

const uploadProducts = async (productsData) => {
    loadingProducts.value = true;
    try {
        // Enviar los datos al backend
        const response = await productsStore.uploadProducts(productsData);
        products.value = productsStore.getProducts;
        if (response.success.length > 0) {
            response.success.length;
            toast.add({ severity: 'success', summary: 'Éxito', detail: response.success.length + ' Datos importados correctamente', life: 3000 });
        }
        if (response.errors.length > 0) {
            response.success.length;
            toast.add({ severity: 'error', summary: 'Error', detail: response.errors.length + ' Datos importados incorrectamente', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al importar los datos', life: 3000 });
    } finally {
        loadingProducts.value = false;
    }
};

// Confirmar eliminación de usuario
const confirmDeleteProduct = (productDeleted) => {
    product.value = productDeleted;
    deleteProductDialog.value = true;
};

// Eliminar producto
const deleteProduct = async () => {
    isLoading.value = true;
    const response = await productsStore.deleteProduct(product.value.id);
    if (response.success == true) {
        products.value = products.value.filter((val) => val.id !== product.value.id);
        deleteProductDialog.value = false;
        product.value = {};
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Eliminado', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al elimar Producto', life: 3000 });
    }
    isLoading.value = false;
};

// Confirmar eliminacion
const confirmDeleteSelected = () => {
    deleteProductsDialog.value = true;
};
// Eliminar Producto
const deleteSelectedProducts = async () => {
    isLoading.value = true;
    const selectedProductsIds = selectedProducts.value.map((product) => product.id);
    const successfulDeletes = [];
    const failedDeletes = [];

    for (const id of selectedProductsIds) {
        try {
            const response = await productsStore.deleteProduct(id);
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
    products.value = products.value.filter((val) => !successfulDeletes.includes(val.id));
    deleteProductsDialog.value = false;
    selectedProducts.value = null;

    if (failedDeletes.length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: failedDeletes.length + ' productos no pudieron ser eliminados', life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Productos Eliminados', life: 3000 });
    }
    isLoading.value = false;
};
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" :loading="isLoading" />
            </template>

            <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template>
        </Toolbar>
        <DataTable
            ref="dt"
            :value="products"
            v-model:selection="selectedProducts"
            dataKey="id"
            :paginator="true"
            :loading="loadingProducts"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} productos"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Productos</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="code" header="Código" :sortable="true" headerStyle="width:10%; min-width:8rem;"> </Column>
            <Column field="name" header="Nombre" :sortable="true" headerStyle="width:25%; min-width:10rem;"> </Column>
            <Column field="description" header="Descripción" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="category.name" header="Categoría" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="unit.symbol" header="Unidad" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    {{ slotProps.data.unit.symbol.toUpperCase() }}
                </template>
            </Column>
            <Column field="user.name" header="Creado por" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editProduct(slotProps.data)" />
                    <Button icon="pi pi-trash" class="mt-2" severity="warn" rounded @click="confirmDeleteProduct(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="productDialog" :style="{ width: '450px' }" header="Detalle de Usuario" :modal="true">
            <div class="mb-3">
                <label for="code" class="block font-bold mb-1">Código</label>
                <InputText id="code" v-model.trim="product.code" required autofocus fluid />
                <small class="text-red-500" v-if="submitted && !product.code">Code es inválido o requerido.</small>
            </div>
            <div class="mb-3">
                <label for="name" class="block font-bold mb-1">Nombre</label>
                <InputText id="name" v-model.trim="product.name" @input="handleNameInput" required autofocus :invalid="submitted && !product.name" fluid />
                <small class="text-red-500" v-if="submitted && !product.name">Nombre es requerido.</small>
            </div>
            <div class="mb-3">
                <label for="description" class="block font-bold mb-1">Descripción</label>
                <Textarea rows="2" id="description" v-model.trim="product.description" required autofocus fluid spellcheck="true" />
            </div>
            <div class="mb-3">
                <label for="unit" class="block font-bold mb-1">Unidad</label>
                <Select id="unit" v-model="product.unit.id" :options="units" optionValue="value" optionLabel="label" placeholder="Selecciona Unidad" fluid></Select>
            </div>
            <div class="mb-3">
                <label for="category" class="block font-bold mb-1">Categoría</label>
                <Select id="category" v-model="product.category.id" :options="categories" optionValue="value" optionLabel="label" placeholder="Selecciona Categoría" fluid></Select>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveProduct" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Confirmar Eliminación" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="product"
                    >Estás seguro de que quieres eliminar <b>{{ product.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteProduct" :loading="isLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="products">¿Está seguro de que desea eliminar los productos seleccionados</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteSelectedProducts" :loading="isLoading" />
            </template>
        </Dialog>
    </div>
</template>
