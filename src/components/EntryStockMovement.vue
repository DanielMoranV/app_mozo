<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useStockMovementsStore } from '@/stores/stockMovementsStore';
import { dformat } from '@/utils/day';
import { formatCurrency, padWithZeros, toUpperCaseText } from '@/utils/validationUtils';
import DataTable from 'primevue/datatable';
import { useToast } from 'primevue/usetoast';
import { reactive, ref } from 'vue';

// Importar otros componentes y utilidades necesarios
const toast = useToast();
const authStore = useAuthStore();
const movementsStore = useStockMovementsStore();

// Definir props para recibir datos del componente padre
const props = defineProps({
    entryStockMovementDialog: {
        type: Boolean,
        default: false
    },
    providers: Array,
    products: Array,
    categoryMovements: Array,
    purchaseOrders: Array
});
const purchaseOrders = ref([...props.purchaseOrders]);

const entryDialog = ref(props.entryStockMovementDialog);

// Definir emits para comunicar eventos al componente padre
const emit = defineEmits(['close', 'save']);

// Mover aquí todas las variables y funciones relacionadas con el ingreso
const entryData = ref({
    series: '',
    number: '',
    amount: 0,
    status: null,
    issue_date: null,
    comment: '',
    provider_id: null
});
const isLoading = ref(false);
const movementsDetails = ref([]);
const itemDetails = ref({});
const toggleFechaVencimiento = ref(false);
const selectedProduct = ref(null);
const filteredProducts = ref();
const filteredPurchaseOrders = ref();
const submitted = ref(false);
const selectedPurchaseOrder = ref(null);
const orderData = ref({});
const errors = reactive({
    category_movement_id: false,
    series: false,
    number: false,
    amount: false,
    status: false,
    issue_date: false,
    provider_id: false
});
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
const errorsItemsProducts = reactive({
    product_id: false,
    expiration_date: false,
    price: false,
    count: false
});
const statusOptions = ref([
    { label: 'Pagado', value: 'pagado' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Crédito', value: 'credito' }
]);
const searchInput = ref(null);

// Mover aquí todas las funciones relacionadas con el ingreso
const addProduct = () => {
    if (!validateItemsProductsFields()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios', life: 3000 });
        return;
    }

    const expirationDate = toggleFechaVencimiento.value ? itemDetails.value.expiration_date : null;

    const existingProductIndex = movementsDetails.value.findIndex((item) => item.product_id === selectedProduct.value.id && item.expiration_date === expirationDate && item.price === parseFloat(itemDetails.value.price));

    if (existingProductIndex !== -1) {
        // El producto ya existe, actualizar cantidad y subtotal
        const existingItem = movementsDetails.value[existingProductIndex];
        existingItem.count += parseFloat(itemDetails.value.count);
        existingItem.sub_total = existingItem.price * existingItem.count;

        toast.add({ severity: 'info', summary: 'Actualizado', detail: 'Cantidad actualizada para el producto existente', life: 3000 });
    } else {
        // El producto no existe, agregar nuevo item
        let newItem = {
            product_id: selectedProduct.value.id,
            name: selectedProduct.value.name,
            expiration_date: expirationDate,
            price: parseFloat(itemDetails.value.price),
            count: parseFloat(itemDetails.value.count),
            sub_total: parseFloat(itemDetails.value.price) * parseFloat(itemDetails.value.count)
        };

        movementsDetails.value.push(newItem);

        toast.add({ severity: 'success', summary: 'Agregado', detail: 'Nuevo producto añadido', life: 3000 });
    }

    // Reiniciar campos y enfocar la búsqueda
    itemDetails.value = {};
    selectedProduct.value = null;
    searchInput.value.$el.querySelector('input').focus();
};
const removeProduct = (product) => {
    movementsDetails.value = movementsDetails.value.filter((val) => val.product_id !== product.product_id);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Eliminado', life: 3000 });
};
const saveEntryMovementStock = async () => {
    if (movementsDetails.value.length === 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se han agregado productos', life: 3000 });
        return;
    }

    const amount = movementsDetails.value.reduce((acc, curr) => acc + curr.sub_total, 0);
    const voucher = {
        series: entryData.value.series,
        number: entryData.value.number,
        amount,
        status: entryData.value.status.value, // Asumiendo que status es un objeto con value y label
        issue_date: entryData.value.issue_date
    };

    const payload = {
        purchaseOrder_id: selectedPurchaseOrder.value ? selectedPurchaseOrder.value.id : null,
        voucher,
        user_id: authStore.user.id,
        warehouse_id: entryData.value.warehouse_id || 1,
        comment: entryData.value.comment,
        category_movements_id: entryData.value.category_movement_id,
        provider_id: entryData.value.provider_id,
        movements_details: movementsDetails.value
    };

    try {
        isLoading.value = true;
        const response = await movementsStore.createEntryStockMovements(payload);

        if (response.success) {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Ingreso de stock agregado correctamente', life: 3000 });
            emit('save');

            resetForm();
        } else {
            throw new Error(response.message || 'Error al crear el ingreso de stock');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    } finally {
        isLoading.value = false;
    }
};
const resetForm = () => {
    entryData.value = {
        series: '',
        number: '',
        amount: 0,
        status: null,
        issue_date: null,
        comment: '',
        provider_id: null,
        warehouse_id: null,
        category_movement_id: null
    };
    movementsDetails.value = [];
    selectedProduct.value = null;
    itemDetails.value = {};
};
const searchOrder = () => {
    if (!selectedPurchaseOrder.value) return;

    orderData.value = {};

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
    movementsDetails.value = purchaseOrderDetail.map(({ product, expiration_date, price, quantity }) => ({
        product_id: product.id,
        name: product.name,
        expiration_date,
        price,
        count: quantity,
        sub_total: price * quantity
    }));
};
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
        filteredProducts.value = [...props.products];
    } else {
        filteredProducts.value = props.products.filter((product) => {
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

const handleClose = () => {
    entryDialog.value = false;
    emit('close');
};

// Lógica para el stepper y validación
function handleNextStep(activateCallback, step) {
    if (step === 1 && validateOrderFields()) {
        activateCallback('2');
    } else if (step === 2 && validateFieldsVoucher()) {
        activateCallback('3');
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios', life: 3000 });
    }
}

function validateItemsProductsFields() {
    errorsItemsProducts.product_id = !selectedProduct.value;
    errorsItemsProducts.expiration_date = toggleFechaVencimiento.value ? !itemDetails.value.expiration_date : false;
    errorsItemsProducts.price = !itemDetails.value.price;
    errorsItemsProducts.count = !itemDetails.value.count;

    return Object.values(errorsItemsProducts).every((error) => !error);
}
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
    <Dialog v-model:visible="entryDialog" header="Ingreso de Productos" :modal="true" :style="{ width: '80vw' }" @update:visible="handleClose">
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
                            <DatePicker id="issue_date" v-model="entryData.issue_date" showIcon fluid iconDisplay="input" class="w-full" :maxDate="new Date()" />
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
                            <template #footer>
                                <div class="flex justify-end">
                                    <h4>Total : {{ formatCurrency(movementsDetails.reduce((acc, curr) => acc + curr.sub_total, 0)) }}</h4>
                                </div>
                            </template>
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
</template>
