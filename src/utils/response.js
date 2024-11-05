export const handleResponseToast = (success, message, status, toast) => {
    if (success) {
        toast.add({ severity: 'success', summary: 'Éxito', detail: message, life: 3000 });
    } else if (status >= 400 && status <= 499) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: message, life: 3000 });
    } else if (status >= 500) {
        toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
    }
};

export async function handleResponse(promise) {
    try {
        const { data } = await promise;
        if (import.meta.env.VITE_DEBUG) {
            console.log(data);
        }
        return { success: true, data };
    } catch (error) {
        if (import.meta.env.VITE_DEBUG) {
            console.log(error);
        }
        return { success: false, message: error.message, status: error.status_code || 500 };
    }
}
