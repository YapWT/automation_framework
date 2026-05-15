import { ref, onMounted, onUnmounted } from 'vue';

export function useContextMenu() {
    const isMenuVisible = ref(false);
    const menuX = ref(0);
    const menuY = ref(0);
    const menuTarget = ref<{ step: any; index: number | null }>({ step: null, index: null });

    const openMenu = (e: MouseEvent, step: any = null, index: number | null = null) => {
        e.preventDefault();

        const menuWidth = 200;
        const menuHeight = 250;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) x -= menuWidth;
        if (y + menuHeight > window.innerHeight) y -= menuHeight;

        menuX.value = x;
        menuY.value = y;
        menuTarget.value = { step, index };
        isMenuVisible.value = true;
    };

    const closeMenu = () => {
        isMenuVisible.value = false;
    };

    const handleGlobalCancel = () => {
        // Close menu on any left click or any key press
        if (isMenuVisible.value) closeMenu();
    };

    onMounted(() => {
        // Global listeners to cancel menu
        window.addEventListener('click', handleGlobalCancel);
        window.addEventListener('keydown', handleGlobalCancel, true); // Catch Esc and others
        window.addEventListener('scroll', closeMenu, true);
    });

    onUnmounted(() => {
        window.removeEventListener('click', handleGlobalCancel);
        window.removeEventListener('keydown', handleGlobalCancel, true);
        window.removeEventListener('scroll', closeMenu, true);
    });

    return { isMenuVisible, menuX, menuY, menuTarget, openMenu, closeMenu };
}
