<script setup>
import EntryStockMovement from '@/components/EntryStockMovement.vue';
import { useProductsStore } from '@/stores/productsStore';
import { useProvidersStore } from '@/stores/providersStore';
import { usePurchaseOrdersStore } from '@/stores/purchaseOrdersStore';
import { useStockMovementsStore } from '@/stores/stockMovementsStore';
import { dformat } from '@/utils/day';
import { formatCurrency } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from 'primevue/datatable';
import { onBeforeMount, onMounted, ref } from 'vue';

const stockMovementsStore = useStockMovementsStore();
const providersStore = useProvidersStore();
const productsStore = useProductsStore();
const purchaseOrdersStore = usePurchaseOrdersStore();

const stockMovements = ref([]);
const categoryMovements = ref([]);
const purchaseOrders = ref([]);
const filters = ref({});
const dt = ref(null);
const entryStockMovementDialog = ref(false);
const expandedRows = ref({});
const products = ref([]);

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
    entryStockMovementDialog.value = true;
};
const handleSaveEntry = async () => {
    // Lógica para manejar el guardado del ingreso
    entryStockMovementDialog.value = false;
    n;
    console.log('holi');
    await loadPurchaseOrders();
    // Actualizar la lista de movimientos si es necesario
};

const handleClose = () => {
    entryStockMovementDialog.value = false;
};
// Opciones para el combobox de estado

// Opciones para el combobox de proveedor
const providers = ref([]);

// Referencia al campo de búsqueda

onBeforeMount(() => {
    initFilters();
});

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
};

onMounted(async () => {
    await Promise.all([loadStockMovements(), loadProviders(), loadProducts(), loadPurchaseOrders(), loadCategoryMovements()]);
});
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Ingreso" icon="pi pi-plus" severity="success" class="mr-2" @click="openNewEntry" />
                <!-- <Button label="Salida" icon="pi pi-minus" severity="danger" class="mr-2" @click="openNewExit" />
                <Button label="Cuadre Stock" icon="pi pi-wrench" severity="warn" class="mr-2" @click="openNewStockCount" />
                <Button label="Traslado" icon="pi pi-arrow-right-arrow-left" severity="info" class="mr-2" @click="openNewTransfer" /> -->
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
        <EntryStockMovement
            v-if="entryStockMovementDialog"
            :entryStockMovementDialog="entryStockMovementDialog"
            :providers="providers"
            :products="products"
            :categoryMovements="categoryMovements"
            :purchaseOrders="purchaseOrders"
            @save="handleSaveEntry"
            @close="handleClose"
        />
    </div>
</template>
