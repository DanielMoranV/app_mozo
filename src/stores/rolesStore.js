import { assignRole, createRole, deleteRole, getRoles, updateRole } from '@/api';
import cache from '@/utils/cache';
import { handleResponseStore } from '@/utils/response';
import { defineStore } from 'pinia';
import { useUsersStore } from './usersStore';

const usersStore = useUsersStore();

export const useRolesStore = defineStore('rolesStore', {
    state: () => ({
        roles: cache.getItem('roles'),
        message: {},
        loading: false,
        role: cache.getItem('role'),
        status: null,
        success: false
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
            this.loading = true;
            const { data } = await handleResponseStore(getRoles(), this);
            if (this.success) {
                this.roles = data;
                cache.setItem('roles', this.roles);
            } else {
                this.roles = null;
            }
            return this.success;
        },
        async createRole(payload) {
            this.loading = true;
            const { data } = await handleResponseStore(createRole(payload), this);
            if (this.success) {
                this.roles.push(data);
                cache.setItem('roles', this.roles);
                return data;
            }
            return this.success;
        },
        async updateRole(payload, id) {
            this.loading = true;
            const { data } = await handleResponseStore(updateRole(payload, id), this);
            if (this.success) {
                this.role = data;
                this.roles = this.roles.map((role) => (role.id === id ? data : role));
                cache.setItem('roles', this.roles);
            }
            return this.success;
        },
        async assignRole(payload) {
            console.log('payload', payload);
            this.loading = true;
            const { data } = await handleResponseStore(assignRole(payload), this);
            if (this.success) {
                usersStore.updateListUser(data, data.id);
                this.message = 'Rol asignado correctamente';
            }
            return this.success;
        },
        async deleteRole(id) {
            this.loading = true;
            const { data } = await handleResponseStore(deleteRole(id), this);
            if (this.success) {
                this.roles = this.roles.filter((role) => role.id !== id);
                cache.setItem('roles', this.roles);
                this.message = `Rol ${data.name} eliminado correctamente`;
            }
            return this.success;
        }
    }
});
