<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useProductsStore } from '@/stores/productsStore';
import { useProvidersStore } from '@/stores/providersStore';
import { usePurchaseOrdersStore } from '@/stores/purchaseOrdersStore';
import { dformat } from '@/utils/day';
import { formatCurrency } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import DatePicker from 'primevue/datepicker';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, reactive, ref } from 'vue';

const isLoading = ref(false);
const purchaseOrderStore = usePurchaseOrdersStore();
const providersStore = useProvidersStore();
const productsStore = useProductsStore();
const authStore = useAuthStore();
const toggleFechaVencimiento = ref(false);

const toast = useToast();

const purchaseOrders = ref([]);
const purchaseOrder = ref({});
const purchaseOrderDetails = ref([]);
const itemDetails = ref([]);
const providers = ref([]);
const products = ref([]);
const expandedRows = ref([]);
const purchaseOrderDialog = ref(false);
const dt = ref(null);
const searchInput = ref(null);
const selectedProduct = ref(null);
const filteredProducts = ref([]);
const confirmSavePurchaseOrderDialog = ref(false);
const confirmDeletePurchaseOrderDialog = ref(false);

const filters = ref({});

const loadProviders = async () => {
    if (!providersStore.getProvidersCbx) {
        await providersStore.fetchProviders();
    }
    providers.value = providersStore.getProvidersCbx;
};
const expandAll = () => {
    expandedRows.value = purchaseOrders.value.reduce((acc, p) => (acc[p.id] = true) && acc, {});
};
const collapseAll = () => {
    expandedRows.value = null;
};
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
const search = (event) => {
    const query = event.query.trim().toLowerCase();

    if (!query.length) {
        filteredProducts.value = [...products.value];
    } else {
        filteredProducts.value = products.value.filter((product) => product.fullDescription.toLowerCase().includes(query));
    }
};
const errorsProduct = reactive({
    expiration_date: false,
    price: false,
    quantity: false,
    product_id: false
});
const validateFieldsProduct = () => {
    errorsProduct.price = !itemDetails.value.price;
    errorsProduct.quantity = !itemDetails.value.quantity;
    errorsProduct.product_id = !selectedProduct.value;
    errorsProduct.expiration_date = toggleFechaVencimiento.value && !itemDetails.value.expiration_date;

    return Object.values(errorsProduct).every((error) => !error);
};
const addProduct = () => {
    if (!validateFieldsProduct()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios', life: 3000 });
        return;
    }

    const { id, name } = selectedProduct.value;
    const { price, quantity, expiration_date, ...otherDetails } = itemDetails.value;

    const item = {
        product_id: id,
        name,
        sub_total: price * quantity,
        price,
        quantity,
        expiration_date: toggleFechaVencimiento.value ? expiration_date : null,
        ...otherDetails
    };

    purchaseOrderDetails.value.push(item);

    itemDetails.value = {};
    selectedProduct.value = null;
    searchInput.value.$el.querySelector('input').focus();
    toast.add({ severity: 'success', summary: 'Éxito', detail: item.name + ' añadido correctamente', life: 3000 });
};
onBeforeMount(() => {
    initFilters();
});
onMounted(async () => {
    purchaseOrders.value = purchaseOrderStore.getPurchaseOrders || (await purchaseOrderStore.fetchPurchaseOrders());
    if (purchaseOrders.value.length == 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se ha podido cargar las ordenes de compra', life: 3000 });
    }
    products.value = productsStore.getProducts || (await productsStore.fetchProducts());
    await loadProviders();
});
const confirmSavePurchaseOrder = () => {
    confirmSavePurchaseOrderDialog.value = true;
};
const savePurchaseOrder = async () => {
    isLoading.value = true;
    let payload = {
        user_id: authStore.getUser.id,
        ...purchaseOrder.value,
        purchase_order_details: purchaseOrderDetails.value
    };
    const response = await purchaseOrderStore.createPurchaseOrderAndDetails(payload);
    if (response.success == true) {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Orden de compra creada correctamente', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se ha podido crear la orden de compra', life: 3000 });
    }
    isLoading.value = false;
    confirmSavePurchaseOrderDialog.value = false;
    purchaseOrderDetails.value = [];
    purchaseOrder.value = {};
    selectedProduct.value = null;
    toggleFechaVencimiento.value = false;
    purchaseOrderDialog.value = false;
};
const errors = reactive({
    provider_id: false,
    warehouse_id: false,
    expected_delivery: false,
    amount: false
});
const openNewPurchaseOrder = () => {
    Object.keys(errors).forEach((key) => (errors[key] = false));
    purchaseOrder.value = {
        warehouse_id: 1,
        company_id: 1
    };
    purchaseOrderDialog.value = true;
};
const validateFields = () => {
    errors.provider_id = !purchaseOrder.value.provider_id;
    errors.warehouse_id = !purchaseOrder.value.warehouse_id;
    errors.expected_delivery = !purchaseOrder.value.expected_delivery;
    errors.amount = !purchaseOrder.value.amount;

    return Object.values(errors).every((error) => !error);
};
const handleNextStep = (callback, step) => {
    if (step === 1 && validateFields()) {
        callback('2');
        searchInput.value.$el.querySelector('input').focus();
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios', life: 3000 });
    }
};

const removeProduct = (product) => {
    console.log(product);
    purchaseOrderDetails.value = purchaseOrderDetails.value.filter((item) => item.product_id !== product.product_id);
};
const selectedPurchaseOrder = ref(null);

const confirmDeletePurchaseOrder = (purchaseOrder) => {
    console.log(purchaseOrder);
    selectedPurchaseOrder.value = purchaseOrder;
    console.log(selectedPurchaseOrder.value);
    confirmDeletePurchaseOrderDialog.value = true;
};
const cancelPurchaseOrder = async () => {
    isLoading.value = true;
    const response = await purchaseOrderStore.cancelPurchaseOrder(selectedPurchaseOrder.value.id);
    if (response.success == true) {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Orden de compra anulada correctamente', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: purchaseOrderStore.msg, life: 3000 });
    }
    isLoading.value = false;
    confirmDeletePurchaseOrderDialog.value = false;
};

const printPurchaseOrder = async (id, number) => {
    const response = await purchaseOrderStore.printPurchaseOrder(id, number);
    console.log(response);
    if (response == 500) {
        toast.add({ severity: 'error', summary: 'Error', detail: `No se ha podido generar el reporte de compra N° ${number}`, life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: `El Reporte de compra N° ${number} se ha generado correctamente`, life: 3000 });
    }
};
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNewPurchaseOrder" />
            </template>
        </Toolbar>
        <DataTable
            ref="dt"
            :value="purchaseOrders"
            :loading="purchaseOrderStore.isLoading"
            v-model:expandedRows="expandedRows"
            dataKey="id"
            :paginator="true"
            :rows="30"
            :filters="filters"
            stripedRows
            selectionMode="single"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} pedidos"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Pedidos de Compra</h4>

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
            <Column expander style="width: 2rem" />
            <Column field="number" header="N°" :sortable="true" headerStyle="width:10%; min-width:10rem;"> </Column>
            <Column field="provider.name" header="Proveedor" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="amount" header="Total" :sortable="true" headerStyle="width:10%; min-width:5rem;">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.amount) }}
                </template>
            </Column>
            <Column field="created_at" header="F. Creación" :sortable="true" headerStyle="width:10%; min-width:12rem;">
                <template #body="slotProps">
                    {{ dformat(slotProps.data.created_at, 'DD/MM/YY hh:mm a') }}
                </template>
            </Column>
            <Column field="expected_delivery" header="F. Entrega" :sortable="true" headerStyle="width:10%; min-width:8rem;">
                <template #body="slotProps">
                    {{ dformat(slotProps.data.expected_delivery, 'DD/MM/YY') }}
                </template>
            </Column>

            <Column field="status" header="Estado" :sortable="true" headerStyle="width:10%; min-width:5rem;">
                <template #body="slotProps">
                    <span class="badge" :class="`badge-${slotProps.data.status.toLowerCase()}`">{{ slotProps.data.status }}</span>
                </template>
            </Column>
            <Column field="user.name" header="Solicitante" :sortable="true" headerStyle="width:10%; min-width:10rem;"> </Column>
            <!-- <Column field="warehouse.name" header="Almacén" :sortable="true" headerStyle="width:10%; min-width:10rem;"> </Column> -->
            <Column field="notes" header="Notas" :sortable="false" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-file-pdf" class="mr-2" severity="success" rounded @click="printPurchaseOrder(slotProps.data.id, slotProps.data.number)" />
                    <Button v-if="slotProps.data.status == 'Pendiente'" icon="pi pi-trash" severity="danger" rounded @click="confirmDeletePurchaseOrder(slotProps.data)" />
                </template>
            </Column>

            <template #expansion="slotProps">
                <div class="p-4">
                    <h5>Detalle de pedido N° {{ slotProps.data.number }}</h5>
                    <DataTable :value="slotProps.data.purchaseOrderDetail">
                        <Column field="product.name" header="Producto" sortable></Column>
                        <Column field="expiration_date" header="Vencimiento" sortable>
                            <template #body="slotProps">
                                {{ slotProps.data.expiration_date ? dformat(slotProps.data.expiration_date, 'DD/MM/YY') : '-' }}
                            </template>
                        </Column>
                        <Column field="quantity" header="Cantidad" sortable></Column>
                        <Column field="price" header="Precio" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.price) }}
                            </template>
                        </Column>
                        <Column field="sub_total" header="Sub Total" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.sub_total) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </template>
            <template #empty>
                <div class="text-center">No se encontraron ordenes de compra</div>
            </template>
        </DataTable>
        <Dialog v-model:visible="purchaseOrderDialog" header="Orden de Compra" :modal="true" :style="{ width: '80vw' }">
            <Stepper value="1" linear>
                <StepList>
                    <Step value="1">Datos Generales</Step>
                    <Step value="2">Detalle de Productos</Step>
                </StepList>
                <StepPanels>
                    <StepPanel v-slot="{ activateCallback }" value="1">
                        <div class="field mt-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded p-3">
                                <div class="field">
                                    <label for="proveedor" class="block mb-1 text-sm font-medium text-gray-700">Proveedor</label>
                                    <!-- MEJORAR LUEGO CON UN AUTOCOMPLETE -->
                                    <Select id="proveedor" v-model="purchaseOrder.provider_id" :options="providers" placeholder="Seleccione un proveedor" required class="w-full" optionValue="value" optionLabel="label" />
                                    <span v-if="errors.provider_id" class="text-red-500 text-sm">El campo Proveedor es requerido</span>
                                </div>
                                <div class="field">
                                    <label for="expected_delivery" class="block mb-1 text-sm font-medium text-gray-700">Fecha de Entrega</label>
                                    <DatePicker id="expected_delivery" v-model="purchaseOrder.expected_delivery" dateFormat="dd/mm/yy" required class="w-full" :minDate="new Date()" />
                                    <span v-if="errors.expected_delivery" class="text-red-500 text-sm">El campo Fecha de Entrega es requerido</span>
                                </div>
                                <div class="field">
                                    <label for="amount" class="block mb-1 text-sm font-medium text-gray-700">Monto Total</label>
                                    <InputNumber id="amount" v-model="purchaseOrder.amount" type="number" required class="w-full rounded-md" mode="currency" currency="PEN" locale="es-PE" />
                                    <span v-if="errors.amount" class="text-red-500 text-sm">El campo Monto Total es requerido</span>
                                </div>
                                <div class="field md:col-span-2 lg:col-span-3">
                                    <label for="comentario" class="block mb-1 text-sm font-medium text-gray-700">Comentario</label>
                                    <Textarea id="comentario" v-model="purchaseOrder.notes" rows="2" class="w-full border border-gray-300 rounded-md p-2" spellcheck="true" />
                                </div>
                            </div>
                            <div class="flex pt-6 justify-between">
                                <Button label="Cancelar" severity="secondary" icon="pi pi-times" @click="purchaseOrderDialog = false" />
                                <Button label="Siguiente" icon="pi pi-arrow-right" @click="handleNextStep(activateCallback, 1)" />
                            </div>
                        </div>
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="2">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                            <!-- Buscar Producto -->
                            <div class="field md:col-span-2 lg:col-span-3">
                                <label for="searchProductos" class="block mb-1 text-sm font-medium text-gray-700">Buscar Producto</label>
                                <AutoComplete ref="searchInput" id="searchProducts" dropdown v-model="selectedProduct" forceSelection optionLabel="fullDescription" :suggestions="filteredProducts" @complete="search" class="w-full" />
                                <span v-if="errorsProduct.product_id" class="text-red-500 text-sm">El campo Producto es requerido</span>
                            </div>
                            <!-- Habilitar Fecha Vencimiento -->
                            <div class="field">
                                <label for="toggleFechaVencimiento" class="block mb-1 text-sm font-medium text-gray-700"> Habilitar Fecha Vencimiento</label>
                                <ToggleButton id="toggleFechaVencimiento" v-model="toggleFechaVencimiento" onLabel="On" offLabel="Off" class="w-full" />
                            </div>
                            <!-- Fecha Expiracion -->
                            <div class="field" v-if="toggleFechaVencimiento">
                                <label for="fechaVencimiento" class="block mb-1 text-sm font-medium text-gray-700">Fecha Vencimiento</label>
                                <DatePicker id="expiration_date" v-model="itemDetails.expiration_date" showIcon fluid iconDisplay="input" class="w-full" :minDate="new Date()" />
                                <span v-if="errorsProduct.expiration_date" class="text-red-500 text-sm">El campo Fecha Vencimiento es requerido</span>
                            </div>
                            <!-- Precio Unitario -->
                            <div class="field">
                                <label for="precio" class="block mb-1 text-sm font-medium text-gray-700">Precio Unitario</label>
                                <InputText id="precio" v-model="itemDetails.price" required class="w-full border border-gray-300 rounded-md p-2" type="number" />
                                <span v-if="errorsProduct.price" class="text-red-500 text-sm">El campo Precio Unitario es requerido</span>
                            </div>
                            <!-- Cantidad -->
                            <div class="field">
                                <label for="cantidad" class="block mb-1 text-sm font-medium text-gray-700">Cantidad</label>
                                <InputText id="cantidad" v-model="itemDetails.quantity" required class="w-full border border-gray-300 rounded-md p-2" type="number" />
                                <span v-if="errorsProduct.quantity" class="text-red-500 text-sm">El campo Cantidad es requerido</span>
                            </div>
                            <!-- Agregar Producto -->
                            <div class="field md:col-span-2 lg:col-span-3">
                                <Button label="Agregar Producto" icon="pi pi-plus" severity="success" @click="addProduct" />
                            </div>
                        </div>
                        <!-- Sección Lista de Productos -->
                        <p class="font-bold text-lg mb-2">Lista de Productos</p>
                        <div class="grid grid-cols-1 border border-gray-300 rounded-md p-4 mb-2">
                            <DataTable :value="purchaseOrderDetails" :loading="purchaseOrderStore.isLoading" v-model:expandedRows="expandedRows" dataKey="id">
                                <Column field="name" header="Producto" sortable></Column>
                                <Column field="expiration_date" header="Vencimiento" sortable>
                                    <template #body="slotProps">
                                        {{ slotProps.data.expiration_date ? dformat(slotProps.data.expiration_date, 'DD/MM/YY') : '-' }}
                                    </template>
                                </Column>
                                <Column field="quantity" header="Cantidad" sortable></Column>
                                <Column field="price" header="Precio" sortable>
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.price) }}
                                    </template>
                                </Column>
                                <Column field="sub_total" header="Sub Total" sortable>
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.sub_total) }}
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
                                <template #footer>
                                    <div class="flex justify-end">
                                        <h4>Total: {{ formatCurrency(purchaseOrderDetails.reduce((acc, curr) => acc + curr.sub_total, 0)) }}</h4>
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                        <div class="flex pt-6 justify-between">
                            <Button label="Anterior" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
                            <Button label="Guardar" icon="pi pi-check" @click="confirmSavePurchaseOrder" />
                        </div>
                    </StepPanel>
                </StepPanels>
            </Stepper>
        </Dialog>
        <Dialog v-model:visible="confirmSavePurchaseOrderDialog" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="purchaseOrder"> Estás seguro de que quieres guardar el pedido? </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="confirmSavePurchaseOrderDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="savePurchaseOrder" :loading="isLoading" />
            </template>
        </Dialog>
        <Dialog v-model:visible="confirmDeletePurchaseOrderDialog" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="selectedPurchaseOrder"> Estás seguro de que quieres anular el pedido N° {{ selectedPurchaseOrder.number }}? </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="confirmDeletePurchaseOrderDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="cancelPurchaseOrder" :loading="isLoading" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
}
.badge-pendiente {
    background-color: #facc15;
    color: black;
}
.badge-aprobado {
    background-color: #22c55e;
    color: white;
}
.badge-anulado {
    background-color: #ef4444;
    color: white;
}
</style>
