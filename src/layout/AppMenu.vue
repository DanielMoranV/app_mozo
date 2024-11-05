<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' },
            { label: 'Perfil', icon: 'pi pi-fw pi-user', to: '/profile' },
            { label: 'Usuarios', icon: 'pi pi-fw pi-users', to: '/users' },
            {
                label: 'Permisos',
                icon: 'pi pi-fw pi-lock',
                items: [
                    { label: 'Roles', icon: 'pi pi-fw pi-verified', to: '/roles' },
                    { label: 'Asignar Rol', icon: 'pi pi-fw pi-user-plus', to: '/assign-role' }
                ]
            },
            { label: 'Empresa', icon: 'pi pi-fw pi-building', to: '/company' }
        ]
    },
    {
        label: 'Almacén',
        items: [
            {
                label: 'Productos',
                icon: 'pi pi-fw pi-th-large',
                items: [
                    { label: 'Productos', icon: 'pi pi-fw pi-briefcase', to: '/products' },
                    { label: 'Categorías', icon: 'pi pi-fw pi-chart-bar', to: '/categories' },
                    { label: 'Unidades', icon: 'pi pi-fw pi-box', to: '/units' }
                ]
            },
            {
                label: 'Inventario',
                icon: 'pi pi-fw pi-box',
                items: [
                    { label: 'Movimientos', icon: 'pi pi-fw pi-briefcase', to: '/movements' },
                    { label: 'Reporte Inventario', icon: 'pi pi-fw pi-chart-bar', to: '/categories' },
                    { label: 'Reporte Kardex', icon: 'pi pi-fw pi-box', to: '/units' },
                    { label: 'Reporte Valorizado', icon: 'pi pi-fw pi-box', to: '/units' }
                ]
            },
            {
                label: 'Pedidos',
                icon: 'pi pi-fw pi-book',
                items: [
                    { label: 'Orden de Compra', icon: 'pi pi-fw pi-briefcase', to: '/purchase-orders' },
                    { label: 'Orden de Venta', icon: 'pi pi-fw pi-chart-bar', to: '/sales-orders' }
                ]
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
