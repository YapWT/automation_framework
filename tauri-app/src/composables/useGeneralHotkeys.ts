import { onMounted, onUnmounted } from 'vue';

export function useGeneralHotkeys(auth: any) {
    const handleKeyDown = (event: KeyboardEvent) => {
        const isCtrl = event.ctrlKey || event.metaKey;
        const isAlt = event.altKey;
        const key = event.key.toLowerCase();
        // const key = event.key;
        const code = event.code;

        // Detect if user is typing in a real input (to avoid accidental triggers)
        // --- 1. FULLSCREEN BLOCK ---
        const isTyping = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName) ||
            (event.target as HTMLElement).isContentEditable;

        // 2. SHORTCUT GUIDE (?) - Trigger even if console is open
        if (key === '?' && !isTyping) {
            event.preventDefault();
            auth.showShortcutGuide.value = !auth.showShortcutGuide.value;
            return;
        }

        // --- 2. ESCAPE: UNIVERSAL CANCEL ---
        if (code === 'Escape') {
            if (auth.showPropertyModal.value) {
                event.preventDefault();
                auth.showPropertyModal.value = false;
                return;
            }
            if (isTyping) {
                (event.target as HTMLElement).blur();
                return;
            }
            if (auth.clipboardStep.value || auth.isMoveMode.value) {
                auth.cancelCopy();
                auth.isMoveMode.value = false;
                return;
            }
            if (auth.showShortcutGuide.value) {
                auth.showShortcutGuide.value = false;
                return;
            }
            auth.selectedStepIndex.value = null;
        }

        if (auth.showShortcutGuide.value || auth.showPropertyModal.value) return;

        // --- 3. MODAL PRIORITY ---
        // If modal is open, don't allow adding steps or deleting things
        if (auth.showPropertyModal.value) {
            // If the modal is open, we ONLY allow Escape to close it.
            // All other designer keys are blocked so focus stays in the modal.
            if (code === 'Escape') {
                event.preventDefault();
                auth.showPropertyModal.value = false;
            }
            return; // STOP all other processing
        }

        // --- 5. GLOBAL SHORTCUTS (Work even if console is open) ---
        if (isAlt) {
            if (key === '1') { event.preventDefault(); auth.activeTab.value = 'editor'; }
            if (key === '2') { event.preventDefault(); auth.activeTab.value = 'preview'; }
            if (key === '3') { event.preventDefault(); auth.activeTab.value = 'saved'; auth.refreshSaved(); }
        }

        if (isCtrl) {
            if (key === 's') { event.preventDefault(); auth.handleSave(); return; }
            if (key === 'j') { event.preventDefault(); auth.showConsole.value = !auth.showConsole.value; return; }
            if (code === 'Enter') { event.preventDefault(); auth.handleRun(true); return; }
            if (key === 'q') { event.preventDefault(); auth.leftSidebarCollapsed.value = !auth.leftSidebarCollapsed.value; }
            if (key === 'e') { event.preventDefault(); auth.rightSidebarCollapsed.value = !auth.rightSidebarCollapsed.value; }
            if (key === 'z') {
                // If typing, don't trigger global undo (let the browser undo the text)
                if (isTyping) return;

                event.preventDefault();
                auth.undo();
                return;
            }
            if (key === 'y') {
                if (isTyping) return;

                event.preventDefault();
                auth.redo();
                return;
            }
            if (key === 'r') { event.preventDefault(); auth.resetDesigner(); }
        }

    };

    onMounted(() => window.addEventListener('keydown', handleKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
}
