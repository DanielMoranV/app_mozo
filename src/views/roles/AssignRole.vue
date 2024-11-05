<script setup>
import { useRolesStore } from '@/stores/rolesStore';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const isLoading = ref(false);

const rolesStore = useRolesStore();
const roles = ref([]);

onMounted(async () => {
    await rolesStore.getRoles();
    roles.value = rolesStore.roles;
});
</script>

<template>
    <div>
        <h1>Asignar Rol</h1>
    </div>
</template>
