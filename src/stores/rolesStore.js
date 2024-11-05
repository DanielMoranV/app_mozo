import { assignRole, createRole, deleteRole, getRoles, updateRole } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useRolesStore = defineStore('rolesStore', {
    state: () => ({
        roles: cache.getItem('roles'),
        msg: {},
        loading: false,
        role: cache.getItem('role'),
        status: null
    }),
    getters: {
        getRolesComboBox(state) {
            if (state.roles == null) return null;
            const rolesCbx = state.roles.map((role) => {
                return { label: role.name.toUpperCase(), value: role.id };
            });
            return rolesCbx;
        },
        getRoles(state) {
            return state.roles;
        }
    },
    actions: {
        async fetchRoles() {
            try {
                this.loading = true;
                const { data } = await getRoles();
                cache.setItem('roles', data);
                this.roles = data;
                this.loading = false;
            } catch (error) {
                this.msg = error.message;
                this.roles = null;
            }
            return this.roles;
        },
        async createRole(payload) {
            try {
                this.loading = true;
                const { data } = await createRole(payload);
                this.roles.push(data);
                cache.setItem('roles', this.roles);
                return data;
            } catch (error) {
                this.msg = error.message || 'Error al crear el rol';
                this.role = null;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        },
        async updateRole(payload, id) {
            try {
                this.loading = true;
                const { data } = await updateRole(payload, id);
                this.roles = this.roles.map((role) => (role.id === id ? data : role));
                cache.setItem('roles', this.roles);
                return data;
            } catch (error) {
                this.msg = error.message || 'Error al actualizar el rol';
                this.role = null;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
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
        },
        async deleteRole(id) {
            try {
                this.loading = true;
                await deleteRole(id);
                this.roles = this.roles.filter((role) => role.id !== id);
                cache.setItem('roles', this.roles);
                return true;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                this.status = error.status_code || 500;
                return this.status;
            } finally {
                this.loading = false;
            }
        }
    }
});
