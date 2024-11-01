import { createPurchaseOrder, createPurchaseOrderAndDetails, getPurchaseOrder, getPurchaseOrders, printPurchaseOrder, updatePurchaseOrder } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const usePurchaseOrdersStore = defineStore('purchaseOrdersStore', {
    state: () => ({
        purchaseOrders: cache.getItem('purchaseOrders'),
        msg: {},
        status: null,
        loading: false
    }),

    getters: {
        isLoading(state) {
            return state.loading;
        },
        getPurchaseOrders(state) {
            return state.purchaseOrders;
        }
    },

    actions: {
        async updateListPurcharseOrder(id) {
            const index = this.purchaseOrders.findIndex((po) => po.id === id);
            if (index !== -1) {
                this.purchaseOrders[index].status = 'Aprobado';
            }
            cache.setItem('purchaseOrders', this.purchaseOrders);
        },
        async fetchPurchaseOrders() {
            try {
                this.loading = true;
                const { data } = await getPurchaseOrders();
                cache.setItem('purchaseOrders', data);
                this.purchaseOrders = data;
            } catch (error) {
                this.msg = error.message;
                this.purchaseOrders = [];
                console.log(error);
            } finally {
                this.loading = false;
                return this.purchaseOrders;
            }
        },

        async fetchPurchaseOrder(id) {
            try {
                const { data } = await getPurchaseOrder(id);
                return data;
            } catch (error) {
                this.msg = error.message;
            }
        },
        async printPurchaseOrder(id, number) {
            try {
                const response = await printPurchaseOrder(id);

                const blob = new Blob([response.data], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);

                link.download = number;
                link.click();
                window.URL.revokeObjectURL(link.href);
                return response;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                return error.status_code;
            }
        },
        async createPurchaseOrder(payload) {
            try {
                const { data } = await createPurchaseOrder(payload);
                this.purchaseOrders.push(data);
                cache.setItem('purchaseOrders', this.purchaseOrders);
                return this.purchaseOrders;
            } catch (error) {
                this.msg = error.message || 'Error al crear orden de compra';
                this.status = error.status_code || 500;
                return this.status;
            }
        },
        async createPurchaseOrderAndDetails(payload) {
            try {
                this.loading = true;
                console.log(payload);
                const { data } = await createPurchaseOrderAndDetails(payload);
                console.log(data);
                this.purchaseOrders.push(data);
                cache.setItem('purchaseOrders', this.purchaseOrders);
                this.loading = false;
                this.status = 200;
                return { success: true, data: data };
            } catch (error) {
                console.log(error);
                this.msg = error.message || 'Error al crear orden de compra';
                this.status = error.status_code || 500;
                this.loading = false;
                return { success: false, msg: this.msg, status: this.status };
            }
        },
        async updatePurchaseOrder(id) {
            try {
                this.loading = true;
                const { data } = await updatePurchaseOrder(id);
                return { success: true, data: data };
            } catch (error) {
                this.msg = error.message || 'Error al actualizar orden de compra';
                this.status = error.status_code || 500;
                return { success: false, msg: this.msg, status: this.status };
            }
        },
        async cancelPurchaseOrder(id) {
            try {
                const { data } = await updatePurchaseOrder({ status: 'Anulado' }, id);

                // Actualizar el estado en this.purchaseOrders
                const index = this.purchaseOrders.findIndex((po) => po.id === id);
                if (index !== -1) {
                    this.purchaseOrders[index].status = 'Anulado';
                }

                cache.setItem('purchaseOrders', this.purchaseOrders);
                return { success: true, data: data };
            } catch (error) {
                console.error(error);
                this.msg = error.message || 'Error al anular orden de compra';
                this.status = error.status_code || 500;
                return { success: false, msg: this.msg, status: this.status };
            }
        }
    }
});
