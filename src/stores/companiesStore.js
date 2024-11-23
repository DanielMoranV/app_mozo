import { createCompany, deleteCompany, getCompanies, updateCompany, updateLogoCompany } from '@/api';
import cache from '@/utils/cache';
import { handleResponseStore } from '@/utils/response';
import { defineStore } from 'pinia';

export const useCompaniesStore = defineStore('companyStore', {
    state: () => ({
        companies: cache.getItem('companies'),
        company: cache.getItem('company'),
        message: '',
        status: 0,
        loading: false,
        success: false
    }),
    actions: {
        async fetchCompanies() {
            this.loading = true;
            const { data } = await handleResponseStore(getCompanies(), this);
            if (this.success) {
                this.companies = data;
                cache.setItem('companies', this.companies);
            }
            this.loading = false;
            return this.success;
        },
        async createCompany(payload) {
            this.loading = true;
            const { data } = await handleResponseStore(createCompany(payload), this);
            if (this.success) {
                this.company = data;
                cache.setItem('company', this.company);
                this.message = 'Empresa creada correctamente';
                if (!this.companies.find((company) => company.id === data.id)) {
                    this.companies.push(data);
                    cache.setItem('companies', this.companies);
                }
            } else {
                this.company = null;
            }
            this.loading = false;
            return this.success;
        },
        async updateCompany(payload, id) {
            this.loading = true;
            const { data } = await handleResponseStore(updateCompany(payload, id), this);
            if (this.success) {
                this.company = data;
                cache.setItem('company', this.company);
                // this.companies = this.companies.map((company) => (company.id === id ? data : company));

                this.message = 'Compañia actualizada correctamente';
            }
            this.loading = false;
            return this.success;
        },
        async updateLogoCompany(payload, id) {
            this.loading = true;
            const { data } = await handleResponseStore(updateLogoCompany(payload, id), this);
            if (this.success) {
                this.company = data;
            }
            this.loading = false;
            return this.success;
        },
        async deleteCompany(id) {
            this.loading = true;
            const { data } = await handleResponseStore(deleteCompany(id), this);
            if (this.success) {
                this.companies = this.companies.filter((company) => company.id !== id);
                cache.setItem('companies', this.companies);
                this.message = `Compañia ${data.company_name} eliminada correctamente`;
            }
            this.loading = false;
            return this.success;
        }
    }
});
