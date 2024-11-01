import { getWarehouses } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useWarehousesStore = defineStore('warehousesStore', {
    state: () => ({
        warehouses: cache.getItem('warehouses'),
        warehouse: cache.getItem('warehouse'),
        msg: {},
        status: null,
        loading: false
    }),

    getters: {
        getWarehouses(state) {
            return state.warehouses;
        },
        getWarehousesCbx(state) {
            if (state.warehouses == null) return null;
            const warehousesCbx = state.warehouses.map((warehouse) => ({
                label: warehouse.name,
                value: warehouse.id
            }));

            return warehousesCbx;
        }
    },

    actions: {
        async fetchWarehouses() {
            try {
                this.loading = true;
                const { data } = await getWarehouses();
                cache.setItem('warehouses', data);
                this.warehouses = data;
                return this.warehouses;
            } catch (error) {
                this.msg = error.message;
                this.warehouses = null;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        },
        async fetchWarehousesCbx() {
            try {
                this.loading = true;
                const { data } = await getWarehouses();
                cache.setItem('warehouses', data);
                this.warehouses = data;
                const warehousesCbx = state.warehouses.map((warehouse) => ({
                    label: warehouse.name,
                    value: warehouse.id
                }));
                return warehousesCbx;
            } catch (error) {
                this.msg = error.message;
                this.warehouses = null;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        }
    }
});
