import { onMounted, onUnmounted } from 'vue';

export function useConsoleHotkeys(auth: any) {
    const handleConsoleKeyDown = (event: KeyboardEvent) => {
        // 1. Only run if console is visible
        if (!auth.showConsole.value) return;

        const isCtrl = event.ctrlKey || event.metaKey;
        const isAlt = event.altKey;
        const key = event.key.toLowerCase();
        const code = event.code;

        // 2. CTRL + ALT + F: Toggle Fullscreen
        if (isCtrl && isAlt && key === 'f') {
            event.preventDefault();
            event.stopPropagation();
            auth.isFullscreenConsole.value = !auth.isFullscreenConsole.value;
            return;
        }

        // 3. CTRL + ESCAPE: Terminate Task
        if (isCtrl && code === 'Escape') {
            event.preventDefault();
            if (auth.isProcessing.value) auth.stopAutomation();
            return;
        }

        // 4. ESCAPE: Blur search focus ONLY
        if (code === 'Escape') {
            const isTyping = event.target instanceof HTMLInputElement;
            if (isTyping) {
                event.preventDefault();
                (event.target as HTMLElement).blur();
            }
            // Logic to close console removed as requested
            return;
        }

        // 5. SCROLLING (Home/End/PgUp/PgDn)
        const consoleBody = document.getElementById('console-body');
        if (consoleBody && !isAlt) { // Avoid conflict with tab switching
            if (code === 'Home') { event.preventDefault(); consoleBody.scrollTo({ top: 0, behavior: 'smooth' }); }
            if (code === 'End') { event.preventDefault(); consoleBody.scrollTo({ top: consoleBody.scrollHeight, behavior: 'smooth' }); }
            if (code === 'PageUp') { event.preventDefault(); consoleBody.scrollBy({ top: -consoleBody.clientHeight, behavior: 'smooth' }); }
            if (code === 'PageDown') { event.preventDefault(); consoleBody.scrollBy({ top: consoleBody.clientHeight, behavior: 'smooth' }); }
        }

        // 6. CTRL + DELETE: Clear Console
        if (isCtrl && code === 'Delete') {
            event.preventDefault();
            auth.tasks.value = [];
        }
    };

    onMounted(() => window.addEventListener('keydown', handleConsoleKeyDown, true));
    onUnmounted(() => window.removeEventListener('keydown', handleConsoleKeyDown, true));
}
