import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/dashboard',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/home/Profile.vue')
                },

                {
                    path: '/config',
                    name: 'config',
                    component: () => import('@/views/home/Parameters.vue')
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/home/Users.vue')
                },

                {
                    path: '/company',
                    name: 'company',
                    component: () => import('@/views/home/Company.vue')
                },
                {
                    path: '/products',
                    name: 'products',
                    component: () => import('@/views/products/Products.vue')
                },
                {
                    path: '/categories',
                    name: 'categories',
                    component: () => import('@/views/products/Categories.vue')
                },
                {
                    path: '/units',
                    name: 'units',
                    component: () => import('@/views/products/Units.vue')
                },
                {
                    path: '/movements',
                    name: 'movements',
                    component: () => import('@/views/inventory/Movements.vue')
                },
                {
                    path: '/purchase-orders',
                    name: 'purchase-orders',
                    component: () => import('@/views/orders/PurchaseOrder.vue')
                },
                {
                    path: '/sales-orders',
                    name: 'sales-orders',
                    component: () => import('@/views/orders/SalesOrder.vue')
                },
                {
                    path: '/roles',
                    name: 'roles',
                    component: () => import('@/views/roles/Roles.vue')
                },
                {
                    path: '/assign-role',
                    name: 'assign-role',
                    component: () => import('@/views/roles/AssignRole.vue')
                }
            ]
        },
        {
            path: '/',
            name: 'login',
            component: () => import('@/views/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/auth/Error.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/NotFound.vue')
        },
        // Ruta catch-all para manejar rutas no definidas
        {
            path: '/:catchAll(.*)',
            redirect: '/pages/notfound'
        }
    ]
});

export default router;
