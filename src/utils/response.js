export const handleApiResponse = (response, toast) => {
    if (response >= 400 && response <= 499) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Error de validación al guardar', life: 3000 });
    } else if (response >= 500) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error en el servidor', life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
    }
};
