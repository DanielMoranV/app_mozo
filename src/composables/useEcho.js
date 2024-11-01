import { useAuthStore } from '@/stores/authStore';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const api_url = import.meta.env.VITE_API_URL;
const { getToken, setSocketId } = useAuthStore();

//Pusher.logToConsole = true;

window.Pusher = Pusher;

const useEcho = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    cluster: import.meta.env.VITE_REVERB_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: false,
    encrypted: true,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${api_url}/broadcasting/auth`,
    //userAuthentication: `${api_url}/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${getToken}`
        }
    }
});

useEcho.connector.pusher.connection.bind('connected', () => {
    const socketId = useEcho.connector.pusher.connection.socket_id;
    setSocketId(socketId);
    console.log(socketId);
});

export default useEcho;

// export default new Echo({
//     broadcaster: 'pusher',
//     key: import.meta.env.VITE_PUSHER_APP_KEY,
//     cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
//     authEndpoint: `${api_url}/broadcasting/auth`,
//     encrypted: true,
//     auth: {
//         headers: {
//             Authorization: `Bearer ${getToken}`
//         }
//     }
// });
