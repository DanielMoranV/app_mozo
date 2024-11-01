import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const api_url = import.meta.env.VITE_API_URL;

const instance = axios.create({
    baseURL: api_url,
    timeout: 10000
});

instance.interceptors.request.use(
    (config) => {
        const { getToken, getSocketId } = useAuthStore();
        if (getToken) {
            config.headers.Authorization = 'Bearer ' + getToken;
        }
        if (getSocketId) {
            config.headers['X-Socket-ID'] = getSocketId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//Add a response interceptor
instance.interceptors.response.use(
    function (response) {
        if (response.config.responseType === 'blob') {
            return response; // Devolver la respuesta completa para blobs
        }
        return response.data;
    },
    function (error) {
        let errData = {
            message: error.response.data.message || error.response.data.error || error.message,
            code: error.code,
            status_code: error.response.status,
            success: false,
            details: error.response.data.errors || null,
            data: error.response.data
        };
        // if (error.response.status) {
        //     errData = error.response.data;
        //     if ([401, 403].indexOf(error.response.status) !== -1) {
        //         console.log(errData);
        //     }
        // }
        return Promise.reject(errData);
    }
);

export default instance;
