<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useProductsStore } from '@/stores/productsStore';
import { useProvidersStore } from '@/stores/providersStore';
import { usePurchaseOrdersStore } from '@/stores/purchaseOrdersStore';
import { useStockMovementsStore } from '@/stores/stockMovementsStore';
import { dformat } from '@/utils/day';
import { formatCurrency, padWithZeros, toUpperCaseText } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from 'primevue/datatable';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, reactive, ref } from 'vue';

const isLoading = ref(false);

const stockMovementsStore = useStockMovementsStore();
const authStore = useAuthStore();
const providersStore = useProvidersStore();
const productsStore = useProductsStore();
const purchaseOrdersStore = usePurchaseOrdersStore();
const toggleFechaVencimiento = ref(false);

const toast = useToast();

const stockMovements = ref([]);
const categoryMovements = ref([]);
const selectedProduct = ref(null);
const movementsDetails = ref([]);
const selectedPurchaseOrder = ref(null);
const purchaseOrders = ref([]);
const itemDetails = ref({});
const listProducts = ref([]);
const stockMovement = ref([]);
const filters = ref({});
const dt = ref(null);
const filteredProducts = ref();
const filteredPurchaseOrders = ref();
const submitted = ref(false);
const entryStockMovementDialog = ref(false);
const expandedRows = ref({});
const selectedStockMovements = ref(null);
const products = ref({});
const items = ref([]);
const isCollapsedVoucher = ref(false);
const isCollapsed = ref(true);

const expandAll = () => {
    expandedRows.value = stockMovements.value.reduce((acc, p) => (acc[p.id] = true) && acc, {});
};
const collapseAll = () => {
    expandedRows.value = null;
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
const openNewEntry = () => {
    stockMovement.value = {};
    submitted.value = false;
    entryStockMovementDialog.value = true;
};
const entryData = ref({
    series: '',
    number: '',
    amount: 0,
    status: null,
    issue_date: null,
    comment: '',
    provider_id: null
});

// Opciones para el combobox de estado
const statusOptions = ref([
    { label: 'Pagado', value: 'pagado' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Crédito', value: 'credito' }
]);

// Opciones para el combobox de proveedor
const providers = ref([]);

const hideDialog = () => {
    entryStockMovementDialog.value = false;
    submitted.value = false;
};

const searchPurchaseOrder = (event) => {
    const query = event.query.trim().toLowerCase();

    if (!query.length) {
        filteredPurchaseOrders.value = [...purchaseOrders.value];
    } else {
        filteredPurchaseOrders.value = purchaseOrders.value.filter((purchaseOrder) => purchaseOrder.number.toLowerCase().includes(query));
    }
};

const search = (event) => {
    const query = event.query.trim().toLowerCase();

    if (!query.length) {
        filteredProducts.value = [...products.value];
    } else {
        filteredProducts.value = products.value.filter((product) => {
            return product.fullDescription.toLowerCase().includes(query);
        });
    }
};
const handleUpperCaseInput = () => {
    entryData.value.series = toUpperCaseText(entryData.value.series);
};
const formatNumber = () => {
    entryData.value.number = padWithZeros(entryData.value.number);
};

// Referencia al campo de búsqueda
const searchInput = ref(null);

const addProduct = () => {
    if (toggleFechaVencimiento.value == false) {
        itemDetails.value.expiration_date = null;
    }

    let item = {
        product_id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        expiration_date: itemDetails.value.expiration_date,
        price: itemDetails.value.price,
        count: itemDetails.value.count,
        sub_total: itemDetails.value.price * itemDetails.value.count
    };

    movementsDetails.value.push(item);

    itemDetails.value = {};
    selectedProduct.value = [];
    searchInput.value.$el.querySelector('input').focus();
};

const saveEntryMovementStock = () => {
    console.log(movementsDetails.value);
    console.log(entryData.value);

    let voucher = {
        series: entryData.value.series,
        number: entryData.value.number,
        amount: entryData.value.amount,
        status: entryData.value.status,
        issue_date: entryData.value.issue_date
    };

    let payload = {
        voucher: voucher,
        user_id: authStore.user.id,
        warehouse_id: 1, //TODO: cambiar por el warehouse seleccionado
        comment: entryData.value.comment,
        category_movements_id: entryData.value.category_movement_id,
        provider_id: entryData.value.provider_id,
        movements_details: movementsDetails.value
    };

    if (movementsDetails.value.length == 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se han agregado productos', life: 3000 });
        return;
    }

    console.log('guardar');
};

const searchOrder = () => {
    if (!selectedPurchaseOrder.value) return;

    const { provider, warehouse, user, purchaseOrderDetail, amount, ...rest } = selectedPurchaseOrder.value;

    Object.assign(orderData.value, {
        ...rest,
        amount: parseFloat(amount),
        provider_name: provider.name,
        warehouse_name: warehouse.name,
        user_name: user.name
    });

    entryData.value.amount = parseFloat(orderData.value.amount);
    entryData.value.provider_id = orderData.value.provider_id;
    entryData.value.comment = orderData.value.notes;
    entryData.value.category_movement_id = 1;
    movementsDetails.value = purchaseOrderDetail.map(({ product_id, product, expiration_date, price, quantity }) => ({
        product_id,
        name: product.name,
        expiration_date,
        price,
        count: quantity,
        sub_total: price * quantity
    }));
};
onBeforeMount(() => {
    initFilters();
});

const removeProduct = (product) => {
    movementsDetails.value = movementsDetails.value.filter((val) => val.id !== product.id);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Eliminado', life: 3000 });
};

const loadProviders = async () => {
    if (!providersStore.getProvidersCbx) {
        await providersStore.fetchProviders();
    }
    providers.value = providersStore.getProvidersCbx;
};

const loadPurchaseOrders = async () => {
    purchaseOrders.value = purchaseOrdersStore.getPurchaseOrders || (await purchaseOrdersStore.fetchPurchaseOrders());

    purchaseOrders.value = purchaseOrders.value.filter((purchaseOrder) => purchaseOrder.status === 'Pendiente');
};

const loadStockMovements = async () => {
    stockMovements.value = stockMovementsStore.getStockMovements || (await stockMovementsStore.fetchStockMovements());
};
const loadProducts = async () => {
    products.value = productsStore.getProducts || (await productsStore.fetchProducts());
};
const loadCategoryMovements = async () => {
    categoryMovements.value = stockMovementsStore.getCategoryMovementsCbx || (await stockMovementsStore.fetchCategoryMovementsCbx());
    console.log(categoryMovements.value);
};

onMounted(async () => {
    await Promise.all([loadStockMovements(), loadProviders(), loadProducts(), loadPurchaseOrders(), loadCategoryMovements()]);
});

const errors = reactive({
    category_movement_id: false,
    series: false,
    number: false,
    amount: false,
    status: false,
    issue_date: false,
    provider_id: false
});
function handleNextStep(activateCallback, step) {
    if (step === 1 && validateOrderFields()) {
        activateCallback('2');
    } else if (step === 2 && validateFieldsVoucher()) {
        activateCallback('3');
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios', life: 3000 });
    }
}

const orderData = ref({});
const errorsOrder = reactive({
    provider_id: false,
    provider_name: false,
    amount: false,
    status: false,
    expected_delivery: false,
    warehouse_id: false,
    user_id: false,
    user_name: false,
    warehouse_name: false
});
function validateOrderFields() {
    errorsOrder.provider_id = !orderData.value.provider_id;
    errorsOrder.provider_name = !orderData.value.provider_name;
    errorsOrder.amount = !orderData.value.amount;
    errorsOrder.status = !orderData.value.status;
    errorsOrder.expected_delivery = !orderData.value.expected_delivery;
    errorsOrder.warehouse_id = !orderData.value.warehouse_id;
    errorsOrder.user_id = !orderData.value.user_id;
    errorsOrder.user_name = !orderData.value.user_name;
    errorsOrder.warehouse_name = !orderData.value.warehouse_name;
    return Object.values(errorsOrder).every((error) => !error);
}
const validateFieldsVoucher = () => {
    errors.category_movement_id = !entryData.value.category_movement_id;
    errors.series = !entryData.value.series;
    errors.number = !entryData.value.number;
    errors.amount = !entryData.value.amount;
    errors.status = !entryData.value.status;
    errors.issue_date = !entryData.value.issue_date;
    errors.provider_id = !entryData.value.provider_id;

    return Object.values(errors).every((error) => !error);
};
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Ingreso" icon="pi pi-plus" severity="success" class="mr-2" @click="openNewEntry" />
                <Button label="Salida" icon="pi pi-minus" severity="danger" class="mr-2" @click="openNewExit" />
                <Button label="Cuadre Stock" icon="pi pi-wrench" severity="warn" class="mr-2" @click="openNewStockCount" />
                <Button label="Traslado" icon="pi pi-arrow-right-arrow-left" severity="info" class="mr-2" @click="openNewTransfer" />
                <!-- <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" :loading="isLoading" /> -->
            </template>

            <!-- <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template> -->
        </Toolbar>
        <DataTable
            ref="dt"
            :value="stockMovements"
            v-model:expandedRows="expandedRows"
            dataKey="id"
            :paginator="true"
            :loading="stockMovementsStore.isLoading"
            :rows="30"
            :filters="filters"
            stripedRows
            selectionMode="single"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} movimientos"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Movimientos de Stock</h4>

                    <div class="flex flex-wrap justify-end gap-2">
                        <Button text icon="pi pi-plus" label="Mostrar Todo" @click="expandAll" />
                        <Button text icon="pi pi-minus" label="Ocultar todo" @click="collapseAll" />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </div>
            </template>
            <Column expander headerStyle="width:2rem" />
            <Column field="id" header="N°" :sortable="true" headerStyle="width:5%; min-width:3rem;"> </Column>
            <Column field="user.name" header="Creado por" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="category_movement.type" header="Tipo" :sortable="true" headerStyle="width:10%; min-width:5rem;">
                <template #body="slotProps">
                    <span
                        :class="{
                            'bg-green-100 text-green-800 text-sm px-2 py-1 rounded font-bold': slotProps.data.category_movement.type.toUpperCase() === 'ENTRADA',
                            'bg-red-100 text-red-800 text-sm px-2 py-1 rounded font-bold': slotProps.data.category_movement.type.toUpperCase() === 'SALIDA'
                        }"
                    >
                        {{ slotProps.data.category_movement.type.toUpperCase() }}
                    </span>
                </template>
            </Column>
            <Column field="category_movement.name" header="Categoría" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="voucher.concat" header="Comprobante" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="voucher.amount" header="Total" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.voucher.amount) }}
                </template>
            </Column>
            <Column field="provider.name" header="Proveedor" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="created_at" header="Fecha" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    {{ dformat(slotProps.data.created_at, 'DD-MM-YY hh:mm a') }}
                </template>
            </Column>
            <Column field="comment" header="Comentario" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <template #expansion="slotProps">
                <div class="p-4">
                    <h5>Detalle de movimiento N° {{ slotProps.data.id }}</h5>
                    <DataTable :value="slotProps.data.movements_details">
                        <Column field="product_batch.product.name" header="Producto" sortable></Column>
                        <Column field="product_batch.batch_number" header="N° Lote" sortable></Column>
                        <Column field="product_batch.expiration_date" header="F. Vencimiento" sortable>
                            <template #body="slotProps">
                                {{ slotProps.data.product_batch.expiration_date ? dformat(slotProps.data.product_batch.expiration_date, 'DD-MM-YY') : '-' }}
                            </template>
                        </Column>

                        <Column field="product_batch.price" header="Precio Unitario" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.product_batch.price) }}
                            </template>
                        </Column>
                        <Column field="count" header="Cantidad" sortable></Column>
                        <Column field="sub_total" header="Sub Total" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.sub_total) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </template>
        </DataTable>
        <Dialog v-model:visible="entryStockMovementDialog" header="Ingreso de Productos" :modal="true" :style="{ width: '80vw' }">
            <Stepper value="1" linear>
                <StepList>
                    <Step value="1">Orden de Compra</Step>
                    <Step value="2">Comprobante</Step>
                    <Step value="3">Detalle de Ingresos</Step>
                </StepList>
                <StepPanels>
                    <StepPanel v-slot="{ activateCallback }" value="1">
                        <div class="field mt-4 mb-4">
                            <div class="flex items-center">
                                <FloatLabel>
                                    <AutoComplete id="purchaseOrderNumber" v-model="selectedPurchaseOrder" :suggestions="filteredPurchaseOrders" @complete="searchPurchaseOrder" optionLabel="number" class="w-full" />
                                    <label for="purchaseOrderNumber" class="block mb-1 text-sm font-medium text-gray-700">N° Orden de Compra</label>
                                </FloatLabel>
                                <Button icon="pi pi-search" class="p-button-outlined p-button-secondary ml-2" @click="searchOrder" />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded p-3">
                            <div class="field">
                                <label for="provider" class="block mb-1 text-sm font-medium text-gray-700">Proveedor</label>
                                <InputText id="provider" v-model="orderData.provider_name" required class="w-full border border-gray-300 rounded-md p-2" autofocus disabled />
                            </div>

                            <div class="field">
                                <label for="expected_delivery" class="block mb-1 text-sm font-medium text-gray-700">Fecha Entrega</label>
                                <InputText id="expected_delivery" v-model="orderData.expected_delivery" required class="w-full border border-gray-300 rounded-md p-2" maxlength="8" disabled />
                            </div>

                            <div class="field">
                                <label for="status" class="block mb-1 text-sm font-medium text-gray-700">Estado</label>
                                <InputText id="status" v-model="orderData.status" required class="w-full border border-gray-300 rounded-md p-2" autofocus disabled />
                            </div>
                            <div class="field">
                                <label for="amountOrder" class="block mb-1 text-sm font-medium text-gray-700">Monto</label>
                                <InputNumber id="amountOrder" v-model="orderData.amount" type="number" required class="w-full rounded-md" mode="currency" currency="PEN" locale="es-PE" disabled />
                            </div>
                            <div class="field">
                                <label for="warehouse_name" class="block mb-1 text-sm font-medium text-gray-700">Almacén</label>
                                <InputText id="warehouse_name" v-model="orderData.warehouse_name" required class="w-full border border-gray-300 rounded-md p-2" autofocus disabled />
                            </div>

                            <div class="field">
                                <label for="user_name" class="block mb-1 text-sm font-medium text-gray-700">Responsable</label>
                                <InputText id="user_name" v-model="orderData.user_name" required class="w-full border border-gray-300 rounded-md p-2" autofocus disabled />
                            </div>
                            <div class="field md:col-span-2 lg:col-span-3">
                                <label for="comentario" class="block mb-1 text-sm font-medium text-gray-700">Notas</label>
                                <Textarea id="comentario" v-model="orderData.notes" rows="2" class="w-full border border-gray-300 rounded-md p-2" spellcheck="true" disabled />
                            </div>
                        </div>
                        <div class="flex pt-6 justify-between">
                            <Button label="Omitir" severity="secondary" icon="pi pi-reply" @click="activateCallback('2')" />
                            <Button label="Siguiente" icon="pi pi-arrow-right" @click="handleNextStep(activateCallback, 1)" />
                        </div>
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="2">
                        <div class="field mt-4 mb-4">
                            <div class="flex items-center">
                                <Select id="category_movement_id" v-model="entryData.category_movement_id" :options="categoryMovements" optionLabel="label" optionValue="value" placeholder="Seleccione una categoría" required />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded p-3">
                            <!-- Serie -->
                            <div class="field">
                                <label for="serie" class="block mb-1 text-sm font-medium text-gray-700">Serie</label>
                                <InputText id="serie" v-model="entryData.series" required class="w-full border border-gray-300 rounded-md p-2" autofocus maxlength="4" @input="handleUpperCaseInput" />
                                <span v-if="errors.series" class="text-red-500 text-sm">El campo Serie es requerido</span>
                            </div>

                            <!-- Número -->
                            <div class="field">
                                <label for="numero" class="block mb-1 text-sm font-medium text-gray-700">Número</label>
                                <InputText id="numero" v-model="entryData.number" required class="w-full border border-gray-300 rounded-md p-2" maxlength="8" type="number" @blur="formatNumber" />
                                <span v-if="errors.number" class="text-red-500 text-sm">El campo Número es requerido</span>
                            </div>

                            <!-- Monto -->
                            <div class="field">
                                <label for="amount" class="block mb-1 text-sm font-medium text-gray-700">Monto</label>
                                <InputNumber id="amount" v-model="entryData.amount" type="number" required class="w-full rounded-md" mode="currency" currency="PEN" locale="es-PE" />
                                <span v-if="errors.amount" class="text-red-500 text-sm">El campo Monto es requerido</span>
                            </div>

                            <!-- Estado -->
                            <div class="field">
                                <label for="status" class="block mb-1 text-sm font-medium text-gray-700">Estado</label>
                                <Select id="status" v-model="entryData.status" :options="statusOptions" optionLabel="label" placeholder="Seleccione el estado" required class="w-full" />
                                <span v-if="errors.status" class="text-red-500 text-sm">El campo Estado es requerido</span>
                            </div>

                            <!-- Fecha Emisión -->
                            <div class="field">
                                <label for="issue_date" class="block mb-1 text-sm font-medium text-gray-700">Fecha Emisión</label>
                                <DatePicker id="issue_date" v-model="entryData.issue_date" showIcon fluid iconDisplay="input" class="w-full" />
                                <span v-if="errors.issue_date" class="text-red-500 text-sm">El campo Fecha Emisión es requerido</span>
                            </div>

                            <!-- Proveedor -->
                            <div class="field">
                                <label for="provider_id" class="block mb-1 text-sm font-medium text-gray-700">Proveedor</label>
                                <Select id="provider_id" v-model="entryData.provider_id" :options="providers" placeholder="Seleccione un proveedor" required class="w-full" optionValue="value" optionLabel="label" />
                                <span v-if="errors.provider_id" class="text-red-500 text-sm">El campo Proveedor es requerido</span>
                            </div>

                            <!-- Comentario -->
                            <div class="field md:col-span-2 lg:col-span-3">
                                <label for="comment" class="block mb-1 text-sm font-medium text-gray-700">Comentario</label>
                                <Textarea id="comment" v-model="entryData.comment" rows="2" class="w-full border border-gray-300 rounded-md p-2" spellcheck="true" />
                            </div>
                        </div>
                        <div class="flex pt-6 justify-between">
                            <Button label="Anterior" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
                            <Button label="Siguiente" icon="pi pi-arrow-right" @click="handleNextStep(activateCallback, 2)" />
                        </div>
                        <!-- <div class="flex pt-6 justify-end">
                            <Button label="Anterior" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
                            <Button label="Siguiente" icon="pi pi-arrow-right" @click="handleNextStep(activateCallback, 2)" />
                        </div> -->
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="3">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                            <!-- Productos -->
                            <div class="field md:col-span-2 lg:col-span-3">
                                <label for="searchProductos" class="block mb-1 text-sm font-medium text-gray-700">Buscar Producto</label>
                                <AutoComplete ref="searchInput" id="searchProducts" dropdown v-model="selectedProduct" forceSelection optionLabel="fullDescription" :suggestions="filteredProducts" @complete="search" class="w-full" />
                            </div>

                            <!-- Toggle Fecha Vencimiento -->
                            <div class="field">
                                <label for="toggleFechaVencimiento" class="block mb-1 text-sm font-medium text-gray-700"> Habilitar Fecha Vencimiento</label>
                                <ToggleButton id="toggleFechaVencimiento" v-model="toggleFechaVencimiento" onLabel="On" offLabel="Off" class="w-full" />
                            </div>

                            <!-- Fecha Vencimiento -->
                            <div class="field" v-if="toggleFechaVencimiento">
                                <label for="expiration_date" class="block mb-1 text-sm font-medium text-gray-700">Fecha Vencimiento</label>
                                <DatePicker id="expiration_date" v-model="itemDetails.expiration_date" showIcon fluid iconDisplay="input" class="w-full" />
                            </div>

                            <!-- Precio Unitario -->
                            <div class="field">
                                <label for="price" class="block mb-1 text-sm font-medium text-gray-700">Precio Unitario</label>
                                <InputText id="price" v-model="itemDetails.price" required class="w-full border border-gray-300 rounded-md p-2" type="number" />
                            </div>

                            <!-- Cantidad -->
                            <div class="field">
                                <label for="count" class="block mb-1 text-sm font-medium text-gray-700">Cantidad</label>
                                <InputText id="count" v-model="itemDetails.count" required class="w-full border border-gray-300 rounded-md p-2" type="number" />
                            </div>

                            <!-- Botón para agregar productos -->
                            <div class="field md:col-span-2 lg:col-span-3">
                                <Button label="Agregar Producto" icon="pi pi-plus" class="p-button-success" @click="addProduct" />
                            </div>
                        </div>

                        <!-- Sección Lista de Productos -->
                        <p class="font-bold text-lg mb-2">Lista de Productos</p>
                        <div class="grid grid-cols-1 border border-gray-300 rounded-md p-4 mb-2">
                            <DataTable
                                :value="movementsDetails"
                                :paginator="true"
                                dataKey="id"
                                selectionMode="single"
                                class="mt-2"
                                :rows="30"
                                stripedRows
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                                currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} productos"
                            >
                                <!-- <Column selectionMode="multiple" headerStyle="width: 3rem"></Column> -->
                                <Column header="#" :headerStyle="{ width: '3rem' }">
                                    <template #body="slotProps">
                                        {{ slotProps.index + 1 }}
                                    </template>
                                </Column>

                                <Column field="product_id" header="Id"></Column>
                                <Column field="name" header="Nombre"></Column>
                                <Column field="price" header="Precio Unitario">
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.price) }}
                                    </template></Column
                                >
                                <Column field="count" header="Cantidad"></Column>
                                <Column field="sub_total" header="Sub Total">
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.sub_total) }}
                                    </template>
                                </Column>
                                <Column field="expiration_date" header="Fecha expiración" :sortable="true">
                                    <template #body="slotProps">
                                        {{ slotProps.data.expiration_date ? dformat(slotProps.data.expiration_date, 'DD-MM-YY') : 'No expira' }}
                                    </template>
                                </Column>
                                <Column header="Acciones">
                                    <template #body="slotProps">
                                        <Button icon="pi pi-trash" class="p-button-danger p-button-sm" @click="removeProduct(slotProps.data)" />
                                    </template>
                                </Column>
                                <template #empty>
                                    <tr>
                                        <td colspan="100%" class="text-center">Añada productos al detalle</td>
                                    </tr>
                                </template>
                            </DataTable>
                        </div>
                        <div class="flex pt-6 justify-between">
                            <Button label="Anterior" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('2')" />
                            <Button label="Guardar" icon="pi pi-check" :loading="isLoading" @click="saveEntryMovementStock" />
                        </div>
                    </StepPanel>
                </StepPanels>
            </Stepper>
        </Dialog>
    </div>
</template>
