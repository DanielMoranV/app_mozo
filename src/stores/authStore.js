import { login, logout, me, updateUser } from '@/api';
import router from '@/router';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        user: cache.getItem('currentUser'),
        token: cache.getItem('token'),
        error: {},
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
                error: this.error
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
            console.log('socketId_store', socketId);
        },
        async login(payload) {
            try {
                this.loading = true;
                const { access_token } = await login(payload);
                cache.setItem('token', access_token);
                this.token = access_token;
                this.session = true;
            } catch (error) {
                this.error = error.message;
                this.user = null;
                this.session = false;
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            try {
                this.loading = true;
                const { message } = await logout();
                this.error = message;
                cache.cleanAll();
                this.user = null;
                this.session = false;
                router.push({ name: 'login' });
                //return this.msg;
            } catch (error) {
                this.error = error.message;
                return this.error;
            } finally {
                this.loading = false;
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
