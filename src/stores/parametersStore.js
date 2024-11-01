import { createParameter, deleteParameter, getParameter, getParameters, updateParameter } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useParametersStore = defineStore('parametersStore', {
    state: () => ({
        parameters: cache.getItem('parameters'),
        msg: {},
        status: null,
        loading: false
    }),

    getters: {
        getParameter(state) {
            return state.parameters;
        },

        isLoading(state) {
            return state.loading;
        }
    },

    actions: {
        async createParameter(payload) {
            try {
                this.loading = true;
                const { data } = await createParameter(payload);
                this.parameters.push(data);
                cache.setItem('parameters', this.parameters);
                return data;
            } catch (error) {
                this.msg = error.message || 'error creating';
                this.parameters = null;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        },
        async fetchParameters() {
            try {
                this.loading = true;
                const { data } = await getParameters();
                cache.setItem('parameters', data);
                this.parameters = data;
                return this.parameters;
            } catch (error) {
                this.msg = error.message || 'error al cargar datos';
                this.parameters = null;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        },
        async fetchParameter(id) {
            try {
                this.loading = true;
                const { data } = await getParameter(id);
                return data;
            } catch (error) {
                this.msg = error.message || 'error al cargar datos';
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        },
        async updateParameter(id) {
            try {
                this.loading = true;
                const { data } = await updateParameter(id);
                return data;
            } catch (error) {
                this.msg = error.message || 'error al cargar datos';
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        },

        async deleteParameter(id) {
            try {
                this.loading = true;
                const response = await deleteParameter(id);
                if (response.success) {
                    this.parameters = this.parameters.filter((parameter) => parameter.id == id);
                    cache.setItem('parameters', this.parameters);
                }
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return { success: false, status: this.status };
            } finally {
                this.loading = false;
            }
        }
    }
});
