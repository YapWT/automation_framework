import { ref, onMounted, onUnmounted } from 'vue';

export function useContextMenu() {
    const isMenuVisible = ref(false);
    const menuX = ref(0);
    const menuY = ref(0);
    const menuTarget = ref<{ step: any; index: number | null; element: HTMLElement | null }>({
        step: null, index: null, element: null
    });

    const openMenu = (e: MouseEvent, step: any = null, index: number | null = null) => {
        e.preventDefault();
        menuTarget.value = { step, index, element: (e.currentTarget as HTMLElement) };

        const menuWidth = 200;
        const menuHeight = 350; // We force the menu to never be larger than this
        const padding = 20;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let x = e.clientX;
        let y = e.clientY;

        // 1. CLAMP HORIZONTAL (Right side)
        if (x + menuWidth > windowWidth) {
            x = windowWidth - menuWidth - padding;
        }

        // 2. CLAMP VERTICAL (Bottom side)
        // If the click is too low, move the menu UP so it's fully on screen
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight - padding;
        }

        menuX.value = Math.max(padding, x);
        menuY.value = Math.max(padding, y);
        isMenuVisible.value = true;
    };

    const closeMenu = () => {
        isMenuVisible.value = false;
    };

    onMounted(() => {
        window.addEventListener('click', closeMenu);
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); }, true);
    });

    onUnmounted(() => {
        window.removeEventListener('click', closeMenu);
    });

    return { isMenuVisible, menuX, menuY, menuTarget, openMenu, closeMenu };
}
