import { getProviders } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useProvidersStore = defineStore('providersStore', {
    state: () => ({
        providers: cache.getItem('providers'),
        msg: '',
        status: null,
        loading: false
    }),

    getters: {
        getProviders(state) {
            return state.providers;
        },

        getProvidersCbx(state) {
            if (state.providers == null) return null;
            const providersCbx = state.providers.map((provider) => ({
                label: provider.name,
                value: provider.id
            }));
            return providersCbx;
        }
    },

    actions: {
        async fetchProviders() {
            try {
                console.log('Fetching providers');
                this.loading = true;
                const { data } = await getProviders();
                cache.setItem('providers', data);
                this.providers = data;
            } catch (error) {
                this.msg = error.message;
                this.providers = [];
            } finally {
                this.loading = false;
                return this.providers;
            }
        }
    }
});
