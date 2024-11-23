import { createParameter, deleteParameter, getParameter, getParameters, updateParameter } from '@/api';
import cache from '@/utils/cache';
import { handleResponseStore } from '@/utils/response';
import { defineStore } from 'pinia';

export const useParametersStore = defineStore('parametersStore', {
    state: () => ({
        parameters: cache.getItem('parameters'),
        parameter: cache.getItem('parameter'),
        message: {},
        status: null,
        loading: false,
        success: false
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
            this.loading = true;
            const { data } = await handleResponseStore(createParameter(payload), this);
            if (this.success) {
                if (this.parameters === null) {
                    await this.fetchParameters();
                }
                this.parameters.push(data);
                cache.setItem('parameters', this.parameters);
                this.message = 'Parámetros asignados correctamente';
            }
            return this.success;
        },
        async fetchParameters() {
            this.loading = true;
            const { data } = await handleResponseStore(getParameters(), this);
            if (this.success) {
                this.parameters = data;
                cache.setItem('parameters', this.parameters);
            } else {
                this.parameters = null;
            }
            return this.success;
        },
        async fetchParameter(id) {
            this.loading = true;
            const { data } = await handleResponseStore(getParameter(id), this);
            if (this.success) {
                this.parameter = data;
                cache.setItem('parameter', this.parameter);
            } else {
                this.parameter = null;
            }
            return this.success;
        },
        async updateParameter(id) {
            this.loading = true;
            const { data } = await handleResponseStore(updateParameter(id), this);
            if (this.success) {
                this.parameter = data;
                cache.setItem('parameter', this.parameter);
            }
            return this.success;
        },

        async deleteParameter(id) {
            this.loading = true;
            const { data } = await handleResponseStore(deleteParameter(id), this);
            if (this.success) {
                this.parameters = this.parameters.filter((parameter) => parameter.id == id);
                cache.setItem('parameters', this.parameters);
                this.message = `Parámetro ${data.id} eliminado correctamente`;
            }
            return this.success;
        }
    }
});
