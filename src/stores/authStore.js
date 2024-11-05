import { login, logout, me, updateUser } from '@/api';
import router from '@/router';
import cache from '@/utils/cache';
import { handleResponse } from '@/utils/response';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        user: cache.getItem('currentUser'),
        token: cache.getItem('token'),
        message: '',
        status: 0,
        success: false,
        role: 'Invitado',
        socketId: cache.getItem('socketId'),
        session: false,
        loading: false
    }),
    getters: {
        getToken(state) {
            if (state.token) {
                return state.token;
            }
        },
        getSocketId(state) {
            return state.socketId;
        },
        auth() {
            const response = {
                loading: this.loading,
                session: this.session,
                message: this.message,
                status: this.status
            };
            return response;
        },
        getUser(state) {
            return state.user;
        },
        getLoading(state) {
            return state.loading;
        }
    },
    actions: {
        async setSocketId(socketId) {
            cache.setItem('socketId', socketId);
            this.socketId = socketId;
        },
        async login(payload) {
            this.loading = true;
            const response = await handleResponse(login(payload));
            this.success = response.success;
            this.loading = false;
            if (response.success) {
                this.token = response.data.access_token;
                cache.setItem('token', this.token);
                this.user = response.data.user;
                cache.setItem('currentUser', this.user);
                this.message = 'Validación Correcta Bienvenido';
                this.session = true;
            } else {
                this.message = response.message;
                this.status = response.status;
                this.session = false;
            }
            return this.success;
        },

        async logout() {
            this.loading = true;
            const response = await handleResponse(logout());
            this.success = response.success;
            this.loading = false;
            if (response.success) {
                this.message = 'Sesión cerrada correctamente';
                cache.cleanAll();
                this.user = null;
                this.session = false;
                router.push({ name: 'login' });
            } else {
                this.message = response.message;
                this.status = response.status;
            }
        },
        async me() {
            try {
                const { data } = await me();
                cache.setItem('currentUser', data.user);
                this.user = data.user;
                this.session = true;
                return this.user;
            } catch (error) {
                this.error = error.message;
                this.user = null;
                this.session = false;
                return this.error;
            }
        },
        async updateUser(payload) {
            this.user = {
                ...this.user,
                ...payload
            };
            cache.setItem('currentUser', this.user);
        },
        async updateProfile(payload, id) {
            try {
                const { data } = await updateUser(payload, id);
                cache.setItem('currentUser', data);
                this.user = data;
                return this.user;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        }
    }
});
