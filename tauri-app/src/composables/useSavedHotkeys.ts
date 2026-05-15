import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';

// Define the interface for what this function returns
interface SavedHotkeyReturn {
    selectedFileIndex: Ref<number | null>;
}

export function useSavedHotkeys(auth: any): SavedHotkeyReturn {
    const selectedFileIndex = ref<number | null>(null);

    // Sync focus when the current file changes via mouse
    watch(() => auth.currentOpenedPath.value, (newPath) => {
        if (!newPath) return;
        const idx = auth.savedScripts.value.indexOf(newPath);
        if (idx !== -1) selectedFileIndex.value = idx;
    }, { immediate: true });

    const getGridColumns = () => {
        const grid = document.querySelector('.saved-grid');
        if (!grid) return 1;
        const gridStyle = window.getComputedStyle(grid);
        const columns = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;
        return columns || 1;
    };

    const handleSavedKeyDown = async (event: KeyboardEvent) => {
        // PRIORITY CHECK: 
        // 1. Must be on Saved Tab
        // 2. Must NOT be in Fullscreen console
        // 3. Must NOT be typing
        if (auth.activeTab.value !== 'saved' || auth.isFullscreenConsole.value) return;
        if (auth.showConsole.value) return;

        const isCtrl = event.ctrlKey || event.metaKey;
        const key = event.key.toLowerCase();
        const code = event.code;
        const files = auth.savedScripts.value;
        const isTyping = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName);

        if (!auth.showConsole.value && code === 'Escape') {
            if (isTyping) (event.target as HTMLElement).blur();
            return;
        }

        if (!auth.showConsole.value && isCtrl && key === 'f') {
            event.preventDefault();
            (document.querySelector('.saved-header .search-input') as HTMLElement)?.focus();
            return;
        }

        if (isTyping) return;

        // NAVIGATION (Only if console is NOT open, so arrows scroll logs instead)
        if (!auth.showConsole.value && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(code)) {
            event.preventDefault();
            if (selectedFileIndex.value === null) {
                selectedFileIndex.value = 0;
            } else {
                const cols = getGridColumns();
                let newIndex = selectedFileIndex.value;

                if (code === 'ArrowRight') newIndex++;
                else if (code === 'ArrowLeft') newIndex--;
                else if (code === 'ArrowDown') newIndex += cols;
                else if (code === 'ArrowUp') newIndex -= cols;
                else if (code === 'Home' || code === 'PageUp') newIndex = 0;
                else if (code === 'End' || code === 'PageDown') newIndex = files.length - 1;

                selectedFileIndex.value = Math.max(0, Math.min(newIndex, files.length - 1));
            }

            setTimeout(() => {
                const activeCard = document.querySelector('.saved-card.kb-active');
                if (activeCard) activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 10);
        }

        // DELETE / BACKSPACE
        if ((key === 'delete' || key === 'backspace') && selectedFileIndex.value !== null) {
            event.preventDefault();
            const idx = selectedFileIndex.value;
            const fileToDelete = files[idx];
            await auth.handleDelete(fileToDelete);

            const remaining = auth.savedScripts.value;
            if (key === 'delete') {
                selectedFileIndex.value = Math.min(idx, remaining.length - 1);
            } else {
                selectedFileIndex.value = Math.max(0, idx - 1);
            }
        }

        // CTRL + G
        if (isCtrl && key === 'g') {
            event.preventDefault();
            const input = window.prompt(`Go to file # (1 - ${files.length}):`);
            if (input) {
                let num = parseInt(input) - 1;
                selectedFileIndex.value = Math.max(0, Math.min(num, files.length - 1));
            }
        }

        // RENAME (R)
        if (key === 'r' && !isCtrl && selectedFileIndex.value !== null) {
            event.preventDefault();
            auth.handleRename(files[selectedFileIndex.value]);
        }

        // LOAD (Ctrl + L) / RUN (Enter)
        if (selectedFileIndex.value !== null) {
            const targetFile = files[selectedFileIndex.value];
            if (isCtrl && key === 'l') { event.preventDefault(); auth.loadScript(targetFile); }
            if (code === 'Enter') { event.preventDefault(); auth.handleRunManual(targetFile); }
        }
    };

    onMounted(() => window.addEventListener('keydown', handleSavedKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleSavedKeyDown));

    return { selectedFileIndex };
}
