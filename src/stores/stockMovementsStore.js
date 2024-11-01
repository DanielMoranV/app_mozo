import { createEntryStockMovements, getCategoryMovements, getStockMovements } from '@/api';
import { usePurchaseOrdersStore } from '@/stores/purchaseOrdersStore';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

const purchaseOrdersStore = usePurchaseOrdersStore();

export const useStockMovementsStore = defineStore('stockMovementsStore', {
    state: () => ({
        stockMovements: cache.getItem('stockMovements'),
        msg: {},
        status: null,
        loading: false,
        categoryMovements: cache.getItem('categoryMovements')
    }),

    getters: {
        isLoading(state) {
            return state.loading;
        },
        getStockMovements(state) {
            return state.stockMovements;
        },
        getCategoryMovements(state) {
            return state.categoryMovements;
        },
        getCategoryMovementsCbx(state) {
            if (state.categoryMovements === null) return null;
            return state.categoryMovements.map((categoryMovement) => ({
                label: categoryMovement.name,
                value: categoryMovement.id,
                type: categoryMovement.type
            }));
        }
    },

    actions: {
        async fetchCategoryMovements() {
            try {
                this.loading = true;
                const { data } = await getCategoryMovements();
                cache.setItem('categoryMovements', data);
                this.categoryMovements = data;
            } catch (error) {
                this.msg = error.message;
                this.categoryMovements = [];
            } finally {
                this.loading = false;
                return this.categoryMovements;
            }
        },
        async fetchCategoryMovementsCbx() {
            try {
                const { data } = await getCategoryMovements();
                cache.setItem('categoryMovements', data);
                this.categoryMovements = data;
                const categoryMovementsCbx = this.categoryMovements.map((categoryMovement) => ({
                    label: categoryMovement.name,
                    value: categoryMovement.id,
                    type: categoryMovement.type
                }));
                return categoryMovementsCbx;
            } catch (error) {
                this.msg = error.message;
                this.categoryMovements = [];
            }
        },
        async fetchStockMovements() {
            try {
                this.loading = true;
                const { data } = await getStockMovements();
                cache.setItem('stockMovements', data);
                this.stockMovements = data;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                this.stockMovements = [];
            } finally {
                this.loading = false;
                return this.stockMovements;
            }
        },
        async createEntryStockMovements(payload) {
            try {
                const { data } = await createEntryStockMovements(payload);
                this.stockMovements.push(data);
                cache.setItem('stockMovements', this.stockMovements);
                this.status = 201;

                if (payload.purchaseOrder_id !== null) {
                    purchaseOrdersStore.updateListPurcharseOrder(payload.purchaseOrder_id);
                }
                return { success: true, data: this.stockMovements, status: this.status };
            } catch (error) {
                console.log(error);
                this.msg = error.message || 'Error al crear el movimiento de stock';
                this.status = error.status_code || 500;
                return { status: this.status, message: this.msg };
            }
        }
    }
});
