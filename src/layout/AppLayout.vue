<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();

const user = ref('');

const { layoutConfig, layoutState, isSidebarActive, resetMenu } = useLayout();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

const isOutsideClicked = (event) => {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    if (!sidebarEl || !topbarEl) {
        return false; // o true, dependiendo de tu lógica
    }

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                resetMenu();
            }
        };

        const sidebarEl = document.querySelector('.layout-sidebar');
        const topbarEl = document.querySelector('.layout-menu-button');

        if (sidebarEl && topbarEl) {
            document.addEventListener('click', outsideClickListener.value);
        }
    }
};

const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
};

onMounted(async () => {
    if (isSidebarActive.value) {
        bindOutsideClickListener();
    }
    user.value = await authStore.getUser;
    if (user.value == null) {
        setTimeout(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Usuario no logueado, inicie sesión para continuar', life: 3000 });
        }, 1000);
        router.push('/');
    }
});
</script>
<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask"></div>
    </div>
    <Toast />
</template>
