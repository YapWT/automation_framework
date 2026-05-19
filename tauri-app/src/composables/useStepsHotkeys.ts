import { onMounted, onUnmounted } from 'vue';

export function useStepsHotkeys(auth: any) {
    const handleKeyDown = (event: KeyboardEvent) => {
        const isCtrl = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;
        const key = event.key.toLowerCase();
        // const key = event.key;
        const code = event.code;

        // Detect if user is typing in a real input (to avoid accidental triggers)
        // --- 1. FULLSCREEN BLOCK ---
        const isTyping = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName) ||
            (event.target as HTMLElement).isContentEditable;

        // --- 4. ENTER: OPEN QUICK EDIT ---
        if (code === 'Enter' && !isCtrl && !isShift && !isTyping) {
            if (auth.selectedStepIndex.value !== null && auth.activeTab.value === 'editor') {
                event.preventDefault();
                auth.showPropertyModal.value = true;
                return; // Stop processing other "Enter" keys
            }
        }

        // --- 6. DESIGNER SHORTCUTS ---
        // Stop here if typing or if console is focused
        if (isTyping || auth.showConsole.value) return;

        // Add Steps (Ctrl + 1-6)
        if (isCtrl && !isShift && code.startsWith('Digit')) {
            const types = ['navigate', 'fill', 'click', 'wait_for', 'upload', 'download'];
            const num = parseInt(code.replace('Digit', '')) - 1;
            if (num >= 0 && num < 6) {
                event.preventDefault();
                auth.addStep(types[num], getTargetIdx(auth));
            }
        }

        // System Steps (Ctrl + Shift + 1-3)
        if (isCtrl && isShift && code.startsWith('Digit')) {
            const sysTypes = ['keyboard_press', 'mkdir', 'move'];
            const num = parseInt(code.replace('Digit', '')) - 1;
            if (num >= 0 && num < 3) {
                event.preventDefault();
                auth.addStep(sysTypes[num], getTargetIdx(auth));
            }
        }

        // Designer Logic (Undo, Redo, Copy, Move)
        if (auth.activeTab.value === 'editor') {
            if (isCtrl) {
                if (key === 'm' && auth.selectedStepIndex.value !== null) { event.preventDefault(); auth.isMoveMode.value = !auth.isMoveMode.value; }
                if (key === 'c' && auth.activeStep.value) { event.preventDefault(); auth.handleCopy(auth.activeStep.value); }
                if (key === 'v' && auth.clipboardStep.value) { event.preventDefault(); auth.handlePaste(getTargetIdx(auth)); scrollActiveIntoView(); }
                if (key === 'g') { handleGoTo(auth); }
            }

            // Arrow Navigation
            if (code === 'ArrowDown' || code === 'ArrowUp') {
                event.preventDefault();
                const dir = code === 'ArrowDown' ? 'down' : 'up';
                if (isCtrl || auth.isMoveMode.value) auth.moveStep(dir);
                else handleSelectionMove(auth, dir);
                scrollActiveIntoView();
            }

            // Home / End
            if (code === 'Home' || code === "PageUp") { event.preventDefault(); auth.selectedStepIndex.value = 0; scrollActiveIntoView('start'); }
            if (code === 'End' || code === "PageDown") { event.preventDefault(); auth.selectedStepIndex.value = auth.workflow.value.steps.length - 1; scrollActiveIntoView('end'); }

            // Delete
            if (key === 'delete' || key === 'backspace') {
                handleDelete(auth, key === 'delete' ? 'next' : 'prev');
            }
        }
    };

    onMounted(() => window.addEventListener('keydown', handleKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
}

// --- HELPERS TO KEEP CODE CLEAN ---

const getTargetIdx = (auth: any) => auth.selectedStepIndex.value !== null ? auth.selectedStepIndex.value + 1 : auth.workflow.value.steps.length;

const scrollActiveIntoView = (position: ScrollLogicalPosition = 'nearest') => {
    setTimeout(() => {
        const activeCard = document.querySelector('.step-card.active');
        if (activeCard) activeCard.scrollIntoView({ block: position, behavior: 'smooth' });
    }, 50);
};

const handleSelectionMove = (auth: any, dir: 'up' | 'down') => {
    const steps = auth.workflow.value.steps;
    const current = auth.selectedStepIndex.value;
    if (current === null) auth.selectedStepIndex.value = 0;
    else {
        const next = dir === 'down' ? current + 1 : current - 1;
        if (next >= 0 && next < steps.length) auth.selectedStepIndex.value = next;
    }
};

const handleDelete = (auth: any, direction: 'next' | 'prev') => {
    const idx = auth.selectedStepIndex.value;
    if (idx === null) return;
    auth.workflow.value.steps.splice(idx, 1);
    const steps = auth.workflow.value.steps;
    if (steps.length === 0) auth.selectedStepIndex.value = null;
    else if (direction === 'next') auth.selectedStepIndex.value = Math.min(idx, steps.length - 1);
    else auth.selectedStepIndex.value = Math.max(0, idx - 1);
};

const handleGoTo = (auth: any) => {
    const total = auth.workflow.value.steps.length;
    const input = window.prompt(`Go to step (1 - ${total}):`);
    if (input) {
        let num = parseInt(input);
        num = Math.max(1, Math.min(num, total));
        auth.selectedStepIndex.value = num - 1;
        scrollActiveIntoView();
    }
};
