import { createCompany, deleteCompany, getCompanies, getCompany, updateCompany, updateLogoCompany } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useCompaniesStore = defineStore('companyStore', {
    state: () => ({
        companies: cache.getItem('companies'),
        company: cache.getItem('company'),
        msg: {},
        status: null,
        loading: false
    }),
    actions: {
        async getCompanies() {
            try {
                const { data } = await getCompanies();
                cache.setItem('companies', data);
                this.companies = data;
                this.loading = true;
            } catch (error) {
                this.msg = error.message;
                this.companies = null;
            }
            return this.companies;
        },
        async createCompany(payload) {
            try {
                const { data } = await createCompany(payload);
                const company = await getCompany(data.id);
                this.company = company.data;
            } catch (error) {
                this.msg = error.message;
                this.company = null;
                this.status = error.status_code;
                return this.status;
            }
            return this.company;
        },
        async updateCompany(payload, id) {
            try {
                const data = await updateCompany(payload, id);
                this.company = data;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async updateLogoCompany(payload, id) {
            try {
                const data = await updateLogoCompany(payload, id);
                this.company = data;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async deleteCompany(id) {
            try {
                const response = await deleteCompany(id);
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        }
    }
});
