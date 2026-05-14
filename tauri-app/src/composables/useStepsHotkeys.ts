import { onMounted, onUnmounted } from 'vue';

export function useStepsHotkeys(auth: any) {
    if (auth.showConsole.value) return;
    const handleKeyDown = (event: KeyboardEvent) => {
        const isCtrl = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;
        const isAlt = event.altKey;
        const key = event.key.toLowerCase();
        const code = event.code;

        if (auth.isFullscreenConsole.value && key !== 'f' && code !== 'Escape') {
            return; 
        }

        const isTyping = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName) ||
            (event.target as HTMLElement).isContentEditable;

        if (code === 'Escape') {
            event.preventDefault();
            // If typing in designer search, just blur
            if (isTyping && auth.activeTab.value === 'editor') {
                (event.target as HTMLElement).blur();
                return;
            }
            // Clear states
            if (auth.clipboardStep.value || auth.isMoveMode.value) {
                auth.cancelCopy();
                auth.isMoveMode.value = false;
                return;
            }
            auth.selectedStepIndex.value = null;
        }

        if (isTyping) return;

        if (isCtrl && key === 'f' && auth.activeTab.value === 'editor') {
            event.preventDefault();
            (document.querySelector('.designer-search-input') as HTMLElement)?.focus();
        }

        if (isTyping) return;

        if (isAlt) {
            if (key === '1') { event.preventDefault(); auth.activeTab.value = 'editor'; }
            if (key === '2') { event.preventDefault(); auth.activeTab.value = 'preview'; }
            if (key === '3') { event.preventDefault(); auth.activeTab.value = 'saved'; auth.refreshSaved(); }
        }

        if (isCtrl && key === 's') { event.preventDefault(); auth.handleSave(); return; }
        if (isCtrl && key === 'j') { event.preventDefault(); auth.showConsole.value = !auth.showConsole.value; return; }
        if (code === 'Enter' && isCtrl) { event.preventDefault(); auth.handleRun(true); return; }
        if (key === 'q' && isCtrl) { event.preventDefault(); auth.leftSidebarCollapsed.value = !auth.leftSidebarCollapsed.value; }
        if (key === 'e' && isCtrl) { event.preventDefault(); auth.rightSidebarCollapsed.value = !auth.rightSidebarCollapsed.value; }

        if (auth.showConsole.value) return;  

        // --- FIXED CTRL + SHIFT + 1/2/3 ---
        if (isCtrl && isShift) {
            const sysTypes = ['keyboard_press', 'mkdir', 'move'];
            // Using 'Digit' code is safer for Shift combinations
            if (code === 'Digit1') { event.preventDefault(); auth.addStep(sysTypes[0], getTargetIdx()); }
            if (code === 'Digit2') { event.preventDefault(); auth.addStep(sysTypes[1], getTargetIdx()); }
            if (code === 'Digit3') { event.preventDefault(); auth.addStep(sysTypes[2], getTargetIdx()); }
        }

        // --- FIXED CTRL + 1-6 ---
        else if (isCtrl && !isShift) {
            const types = ['navigate', 'fill', 'click', 'wait_for', 'upload', 'download'];
            if (code.startsWith('Digit')) {
                const num = parseInt(code.replace('Digit', '')) - 1;
                if (num >= 0 && num < 6) {
                    event.preventDefault();
                    auth.addStep(types[num], getTargetIdx());
                }
            }
        }

        // --- FIXED CTRL + G (Boundary Logic) ---
        if (isCtrl && key === 'g') {
            event.preventDefault();
            if (auth.activeTab.value !== 'editor') return;
            const total = auth.workflow.value.steps.length;
            if (total === 0) return;
            const input = window.prompt(`Go to step (1 - ${total}):`);
            if (input !== null) {
                let num = parseInt(input);
                if (isNaN(num) || num <= 1) num = 1; // Lower than 1 -> Go to start
                if (num > total) num = total;        // Bigger than max -> Go to bottom

                auth.selectedStepIndex.value = num - 1;
                scrollActiveIntoView(num === 1 ? 'start' : (num === total ? 'end' : 'center'));
            }
        }

        if (auth.activeTab.value === 'editor') {
            const steps = auth.workflow.value.steps;
            const current = auth.selectedStepIndex.value;

            if (code === 'ArrowDown' || code === 'ArrowUp') {
                event.preventDefault();
                const dir = code === 'ArrowDown' ? 'down' : 'up';

                if (isCtrl || auth.isMoveMode.value) {
                    auth.moveStep(dir); // Swaps items
                } else {
                    if (current === null) auth.selectedStepIndex.value = 0;
                    else {
                        const next = dir === 'down' ? current + 1 : current - 1;
                        if (next >= 0 && next < steps.length) auth.selectedStepIndex.value = next;
                    }
                }
                scrollActiveIntoView();
            }

            if (code === 'Home' || code === 'PageUp') {
                event.preventDefault();
                auth.selectedStepIndex.value = 0;
                scrollActiveIntoView('start');
            }
            if (code === 'End' || code === 'PageDown') {
                event.preventDefault();
                auth.selectedStepIndex.value = steps.length - 1;
                scrollActiveIntoView('end');
            }
        }

        if (isCtrl) {
            if (key === 'z') { event.preventDefault(); auth.undo(); }
            if (key === 'y') { event.preventDefault(); auth.redo(); }
            if (key === 'r') { event.preventDefault(); auth.resetDesigner(); }
            if (key === 'm' && auth.selectedStepIndex.value !== null) { event.preventDefault(); auth.isMoveMode.value = !auth.isMoveMode.value; }
            if (key === 'v' && auth.clipboardStep.value) { event.preventDefault(); auth.handlePaste(getTargetIdx()); scrollActiveIntoView(); }  
        }

        if (key === 'delete' || key === 'backspace') {
            if (auth.selectedStepIndex.value !== null) {
                event.preventDefault();
                const idx = auth.selectedStepIndex.value;
                const steps = auth.workflow.value.steps;
                steps.splice(idx, 1);

                if (key === 'delete') {
                    // Go to NEXT
                    if (idx < steps.length) auth.selectedStepIndex.value = idx;
                    else if (steps.length > 0) auth.selectedStepIndex.value = steps.length - 1;
                    else auth.selectedStepIndex.value = null;
                } else {
                    // Go to PREVIOUS (Backspace)
                    if (idx > 0) auth.selectedStepIndex.value = idx - 1;
                    else if (steps.length > 0) auth.selectedStepIndex.value = 0;
                    else auth.selectedStepIndex.value = null;
                }
            }
        }

        if (isCtrl && key === 'c' && auth.activeStep.value) {
            event.preventDefault();
            auth.handleCopy(auth.activeStep.value);
        }
    };

    const getTargetIdx = () => auth.selectedStepIndex.value !== null ? auth.selectedStepIndex.value + 1 : auth.workflow.value.steps.length;

    const scrollActiveIntoView = (position: ScrollLogicalPosition = 'nearest') => {
        setTimeout(() => {
            const activeCard = document.querySelector('.step-card.active');
            if (activeCard) activeCard.scrollIntoView({ block: position, behavior: 'smooth' });
        }, 50);
    };

    onMounted(() => window.addEventListener('keydown', handleKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
}
