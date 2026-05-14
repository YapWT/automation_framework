import { onMounted, onUnmounted, ref, watch } from 'vue';

export function useSavedHotkeys(auth: any) {
    const selectedFileIndex = ref<number | null>(null);

    // Helper to find the index of the currently opened file
    const syncIndexWithOpenedFile = () => {
        if (!auth.currentOpenedPath.value) return;
        const idx = auth.savedScripts.value.indexOf(auth.currentOpenedPath.value);
        if (idx !== -1) selectedFileIndex.value = idx;
    };

    // Watch for file changes (Mouse loads, Auto-recovery, etc.) to sync the hint
    watch(() => auth.currentOpenedPath.value, () => {
        syncIndexWithOpenedFile();
    }, { immediate: true });

    const getGridColumns = () => {
        const grid = document.querySelector('.saved-grid');
        if (!grid) return 1;
        const gridStyle = window.getComputedStyle(grid);
        const columns = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;
        return columns || 1;
    };

    const handleSavedKeyDown = async (event: KeyboardEvent) => {
        if (auth.activeTab.value !== 'saved') return;

        const isCtrl = event.ctrlKey || event.metaKey;
        const key = event.key.toLowerCase();
        const code = event.code;
        const files = auth.savedScripts.value;
        const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;

        if (code === 'Escape') {
            if (isTyping) { event.preventDefault(); (event.target as HTMLElement).blur(); }
            return;
        }

        if (isCtrl && key === 'f') {
            event.preventDefault();
            (document.querySelector('.saved-header .search-input') as HTMLElement)?.focus();
            return;
        }

        if (isTyping) return;

        // ADDED: HOME / END / PAGE NAVIGATION
        if (code === 'Home' || code === 'PageUp') {
            event.preventDefault();
            selectedFileIndex.value = 0;
            scrollFileIntoView();
        }
        if (code === 'End' || code === 'PageDown') {
            event.preventDefault();
            selectedFileIndex.value = files.length - 1;
            scrollFileIntoView();
        }

        // ADDED: R KEY TO RENAME
        if (key === 'r' && selectedFileIndex.value !== null) {
            event.preventDefault();
            auth.handleRename(files[selectedFileIndex.value]);
        }

        // NAVIGATION
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
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

                newIndex = Math.max(0, Math.min(newIndex, files.length - 1));
                selectedFileIndex.value = newIndex;
            }
            scrollFileIntoView();
        }

        // DELETE / BACKSPACE
        if (key === 'delete' || key === 'backspace') {
            if (selectedFileIndex.value !== null && files[selectedFileIndex.value]) {
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
                if (remaining.length === 0) selectedFileIndex.value = null;
            }
        }

        // CTRL + G
        if (isCtrl && key === 'g') {
            event.preventDefault();
            const input = window.prompt(`Go to file # (1 - ${files.length}):`);
            if (input) {
                let num = parseInt(input) - 1;
                selectedFileIndex.value = Math.max(0, Math.min(num, files.length - 1));
                scrollFileIntoView();
            }
        }

        // ACTIONS
        if (selectedFileIndex.value !== null) {
            const targetFile = files[selectedFileIndex.value];
            if (isCtrl && key === 'l') { event.preventDefault(); auth.loadScript(targetFile); }
            if (code === 'Enter') { event.preventDefault(); auth.handleRunManual(targetFile); }
        }
    };

    const scrollFileIntoView = () => {
        setTimeout(() => {
            const activeCard = document.querySelector('.saved-card.kb-active');
            if (activeCard) activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 10);
    };

    onMounted(() => window.addEventListener('keydown', handleSavedKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleSavedKeyDown));

    return { selectedFileIndex };
}
