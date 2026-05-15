import { onMounted, onUnmounted } from 'vue';

export function useGuideHotkeys(auth: any) {
    const handleGuideKeyDown = (event: KeyboardEvent) => {
        // Only active if the guide is actually open
        if (!auth.showShortcutGuide.value) return;

        const isCtrl = event.ctrlKey || event.metaKey;
        const key = event.key.toLowerCase();
        const code = event.code;

        // 1. CTRL + F: Focus Search Bar inside guide
        if (isCtrl && key === 'f') {
            event.preventDefault();
            const input = document.querySelector('.search-input-wrapper input') as HTMLInputElement;
            if (input) input.focus();
            return;
        }

        // Detect if typing to avoid scrolling while searching
        const isTyping = event.target instanceof HTMLInputElement;

        // 2. ESCAPE: Blur search or Close guide
        if (code === 'Escape') {
            if (isTyping) {
                (event.target as HTMLElement).blur();
            } else {
                auth.showShortcutGuide.value = false;
            }
            return;
        }

        if (isTyping) return; // Prevent scrolling shortcuts while typing in search

        // --- SCROLLING LOGIC for .guide-body ---
        const guideBody = document.querySelector('.guide-body');
        if (guideBody) {
            const scrollAmount = 100;
            const pageAmount = guideBody.clientHeight - 40;

            if (code === 'ArrowDown') {
                event.preventDefault();
                guideBody.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }
            if (code === 'ArrowUp') {
                event.preventDefault();
                guideBody.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
            }
            if (code === 'PageDown') {
                event.preventDefault();
                guideBody.scrollBy({ top: pageAmount, behavior: 'smooth' });
            }
            if (code === 'PageUp') {
                event.preventDefault();
                guideBody.scrollBy({ top: -pageAmount, behavior: 'smooth' });
            }
            if (code === 'Home') {
                event.preventDefault();
                guideBody.scrollTo({ top: 0, behavior: 'smooth' });
            }
            if (code === 'End') {
                event.preventDefault();
                guideBody.scrollTo({ top: guideBody.scrollHeight, behavior: 'smooth' });
            }
        }
    };

    onMounted(() => window.addEventListener('keydown', handleGuideKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleGuideKeyDown));
}
