import { assignRole, getRoles } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useRolesStore = defineStore('rolesStore', {
    state: () => ({
        roles: cache.getItem('roles'),
        msg: {},
        loading: false
    }),
    getters: {
        getRolesComboBox(state) {
            if (state.roles == null) return null;
            const rolesCbx = state.roles.map((role) => {
                return { label: role.name.toUpperCase(), value: role.id };
            });
            return rolesCbx;
        }
    },
    actions: {
        async fetchRoles() {
            try {
                this.loading = true;
                const data = await getRoles();
                const roles = data.roles;
                cache.setItem('roles', roles);
                this.roles = roles;
                this.loading = false;
            } catch (error) {
                this.msg = error.message;
                this.roles = null;
            }
            return this.roles;
        },
        async fetchRolesComboBox() {
            try {
                const { data } = await getRoles();
                cache.setItem('roles', data);
                this.roles = data;
                const rolesCbx = data.map((role) => {
                    return { label: role.name.toUpperCase(), value: role.id };
                });
                return rolesCbx;
            } catch (error) {
                this.msg = error.message;
                return null;
            }
        },
        async assignRole(payload) {
            try {
                this.msg = await assignRole(payload);
            } catch (error) {
                this.msg = error.message;
            }
            return this.msg;
        }
    }
});
