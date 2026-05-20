import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { message, ask, open, save } from '@tauri-apps/plugin-dialog';
import { join } from '@tauri-apps/api/path';
import { workflow, Task, STRATEGIES_BY_ACTION } from '../types/automation';
import { ScriptGenerator } from '../services/Generator';

export function useAutomation() {
    const activeTab = ref<'editor' | 'preview' | 'saved'>('editor');

    const tasks = ref<Task[]>([]);
    const savedScripts = ref<string[]>([]);
    const isProcessing = ref(false);
    const showConsole = ref(false);
    const isManualEdit = ref(false);
    const manualCode = ref("");
    const selectedStepIndex = ref<number | null>(null);
    const clipboardStep = ref<any>(null);
    const leftSidebarCollapsed = ref(false);
    const rightSidebarCollapsed = ref(false);
    const copiedSourceId = ref<number | null>(null);
    const currentOpenedPath = ref<string | null>(null);
    const lastSavedCode = ref("");
    const history = ref<string[]>([]);
    const redoStack = ref<string[]>([]);
    const isMoveMode = ref(false);
    const designerSearchQuery = ref("");
    const runningFilePath = ref<string | null>(null); const selectedFileIndex = ref<number | null>(null);
    const isFullscreenConsole = ref(false);
    const showPropertyModal = ref(false);
    const showShortcutGuide = ref(false);

    const isModified = computed(() => {
        if (!currentOpenedPath.value) return false;
        return finalCode.value.trim() !== lastSavedCode.value.trim();
    });

    const finalCode = computed({
        get: () => {
            const payload = {
                ...workflow.value,
                openedPath: currentOpenedPath.value
            };
            return isManualEdit.value ? manualCode.value : ScriptGenerator.generate(payload);
        },
        set: (val) => { manualCode.value = val; isManualEdit.value = true; }
    });

    const activeStep = computed(() =>
        selectedStepIndex.value !== null ? workflow.value.steps[selectedStepIndex.value] : null
    );

    function saveHistory() {
        history.value.push(JSON.stringify(workflow.value));
        if (history.value.length > 50) history.value.shift();
        redoStack.value = [];
    }

    function undo() {
        if (history.value.length === 0) return;
        redoStack.value.push(JSON.stringify(workflow.value));

        const previous = JSON.parse(history.value.pop()!);
        workflow.value.steps = previous.steps;
        workflow.value.name = previous.name;
        workflow.value.config = previous.config;
    }

    function redo() {
        if (redoStack.value.length === 0) return;
        history.value.push(JSON.stringify(workflow.value));

        const next = JSON.parse(redoStack.value.pop()!);
        workflow.value.steps = next.steps;
        workflow.value.name = next.name;
        workflow.value.config = next.config;
    }

    function moveStep(direction: 'up' | 'down') {
        saveHistory();
        const idx = selectedStepIndex.value;
        if (idx === null) return;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= workflow.value.steps.length) return;

        const temp = workflow.value.steps[idx];
        workflow.value.steps[idx] = workflow.value.steps[newIdx];
        workflow.value.steps[newIdx] = temp;
        selectedStepIndex.value = newIdx;

        setTimeout(() => {
            document.querySelector('.step-card.active')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 10);
    }

    function addStep(type: string, index?: number) {
        saveHistory();

        isManualEdit.value = false;
        const defaults: Record<string, any> = {
            navigate: { url: 'https://' },
            wait_for: { matchBy: 'text', selector: '', timeout: 30000, index: 0, exact: false, force: false },
            fill: { matchBy: 'textbox', selector: '', value: '', exact: false, force: false, timeout: 30000, index: 0 },
            click: { matchBy: 'button', selector: '', exact: false, force: false, timeout: 30000, index: 0 },
            keyboard_press: { key: 'Enter' },
            upload: { matchBy: 'label', selector: '', path: '', index: 0, exact: false, force: false },
            download: { matchBy: 'button', selector: '', path: './downloads', exact: false, force: false, index: 0 },
            mkdir: { path: '' },
            move: { from: '', to: '' }
        };

        const newStep = {
            id: Date.now(),
            action: type,
            params: { ...defaults[type] }
        };

        if (typeof index === 'number') {
            workflow.value.steps.splice(index, 0, newStep);
            selectedStepIndex.value = index;
        } else {
            workflow.value.steps.push(newStep);
            selectedStepIndex.value = workflow.value.steps.length - 1;
        }
    }

    async function selectExcel() {
        saveHistory();

        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Spreadsheets',
                extensions: ['xlsx', 'xls', 'csv', 'ods', 'xlsb', 'numbers']
            }]
        });
        if (selected) {
            workflow.value.config.excelPath = selected as string;
            workflow.value.config.useExcel = true;
        }
    }

    function resetDesigner() {
        saveHistory();

        workflow.value.steps = [];
        selectedStepIndex.value = null;

        workflow.value.name = "automation_task";

        workflow.value.config.excelPath = "";
        workflow.value.config.useExcel = false;

        currentOpenedPath.value = null; lastSavedCode.value = "";
        cancelCopy();
        isManualEdit.value = false;
        activeTab.value = 'editor';

    }

    function handleIncomingLog(rawLog: string) {
        const log = rawLog.trim();
        if (!log) return;

        if (log.startsWith("TASK:")) {
            const parts = log.split(':');
            const status = parts[1];
            const id = parts[2];
            const message = parts.slice(3).join(':');

            const existingTask = tasks.value.find(t => t.id === id);

            if (status === 'START') {
                if (existingTask) {
                    existingTask.status = 'running';
                    existingTask.label = message || id;
                } else {
                    tasks.value.push({ id, label: message || id, status: 'running' });
                }
            }
            else if (status === 'DONE') {
                if (existingTask) existingTask.status = 'success';
            }
            else if (status === 'FAIL') {
                if (existingTask) {
                    existingTask.status = 'error';
                    existingTask.label = `Error: ${message}`;
                }
            }
        } else {
            tasks.value.push({
                id: `sys-${Date.now()}`,
                label: log,
                status: 'success'
            });
        }
    }

    async function refreshSaved() {
        savedScripts.value = await invoke('list_saved_scripts');
    }

    function handleCopy(step: any) {
        clipboardStep.value = JSON.parse(JSON.stringify(step));
        copiedSourceId.value = step.id;
    }

    function handlePaste(index?: number) {
        saveHistory();

        if (clipboardStep.value) {
            const newStep = JSON.parse(JSON.stringify(clipboardStep.value));
            newStep.id = Date.now();

            let targetIndex: number;
            if (typeof index === 'number') {
                workflow.value.steps.splice(index, 0, newStep);
                targetIndex = index;
            } else {
                workflow.value.steps.push(newStep);
                targetIndex = workflow.value.steps.length - 1;
            }

            selectedStepIndex.value = targetIndex;
        }
    }

    function cancelCopy() {
        clipboardStep.value = null;
        copiedSourceId.value = null;
    }

    async function handleRun(isTemp: boolean) {
        tasks.value = [];
        showConsole.value = true;
        isProcessing.value = true;
        const name = isTemp ? "temp_task.ts" : `${workflow.value.name}.ts`;
        try {
            await invoke('auto_save_temp', { code: finalCode.value });
            handleIncomingLog(`TASK:START:EXECUTION:Running ${name}`);
            await invoke('execute_script', { filename: name });
        } catch (err: any) {
            const errorMsg = err?.message || err?.toString?.() || String(err);
            console.error('Script execution error:', errorMsg);
            handleIncomingLog(`TASK:FAIL:EXECUTION:Error: ${errorMsg}`);
            isProcessing.value = false;
        }
    }

    async function handleSave() {
        try {
            const defaultFolder = await invoke('get_default_save_path') as string;

            const suggestion = currentOpenedPath.value ? await join(defaultFolder, currentOpenedPath.value) :
                await join(defaultFolder, `${workflow.value.name}.ts`);

            const selectedPath = await save({
                title: 'Save Automation Script',
                defaultPath: suggestion,
                filters: [{ name: 'TypeScript', extensions: ['ts'] }]
            });

            if (!selectedPath) return;

            await invoke('save_permanent_script', {
                code: finalCode.value,
                filename: selectedPath
            });

            const filename = selectedPath.split(/[\\/]/).pop() || 'task.ts';
            workflow.value.name = filename.replace('.ts', '');
            currentOpenedPath.value = selectedPath;
            lastSavedCode.value = finalCode.value;

            await refreshSaved();
            await message("Script saved successfully", { title: "Success" });
        } catch (err) {
            handleIncomingLog(`TASK:FAIL:SYSTEM:Save failed: ${err}`);
        }
    }

    async function stopAutomation() {
        try {
            await invoke('stop_script');
            isProcessing.value = false;
            runningFilePath.value = null;

            handleIncomingLog("TASK:FAIL:EXECUTION:Terminated by User");
            tasks.value.forEach(t => {
                if (t.status === 'running') t.status = 'error';
            });
        } catch (err) { console.error(err); }
    }

    async function handleRunManual(file: string) {
        tasks.value = [];
        showConsole.value = true;
        isProcessing.value = true;
        runningFilePath.value = file;

        try {
            handleIncomingLog(`TASK:START:EXECUTION:Running script: ${file}`);
            await invoke('execute_script', { filename: file });
        } catch (err: any) {
            const errorMsg = err?.message || err?.toString?.() || String(err);
            console.error('Script execution error:', errorMsg);
            handleIncomingLog(`TASK:FAIL:EXECUTION:Error: ${errorMsg}`);
            isProcessing.value = false;
            runningFilePath.value = null;
        }
    }

    async function restoreTempTask() {
        try {
            const code = await invoke('read_script_content', { filename: 'temp_task.ts' }) as string;
            if (!code || code.trim() === "") return;

            const match = code.match(/@metadata\s([A-Za-z0-9+/=]+)/);
            if (match && match[1]) {
                const decodedData = JSON.parse(atob(match[1]));

                if (decodedData.steps && decodedData.steps.length > 0) {
                    workflow.value.steps = decodedData.steps;
                    workflow.value.config = decodedData.config;
                    workflow.value.name = decodedData.name || "recovered_task";

                    if (decodedData.path) {
                        currentOpenedPath.value = decodedData.path;

                        try {
                            const originalFileContent = await invoke('read_script_content', {
                                filename: decodedData.path
                            }) as string;
                            lastSavedCode.value = originalFileContent;
                        } catch (e) {
                            console.error("Original file missing, treated as new file");
                            currentOpenedPath.value = null;
                        }
                    }

                    activeTab.value = 'editor';
                }
            }
        } catch (e) { console.log("Clean session."); }
    }

    async function handleDelete(file: string) {
        const confirmed = await ask(`Are you sure you want to delete ${file}?`, {
            title: 'Confirm Delete',
            kind: 'warning',
        });

        if (confirmed) {
            try {
                await invoke('delete_script', { filename: file });
                await refreshSaved(); 
                await message("File deleted successfully", { title: "Success" });
            } catch (err) {
                handleIncomingLog(`TASK:FAIL:SYSTEM:Failed to delete: ${err}`);
            }
        }
    }

    async function loadScript(file: string) {
        saveHistory();
        const code = await invoke('read_script_content', { filename: file }) as string;

        currentOpenedPath.value = file;
        lastSavedCode.value = code;

        const match = code.match(/@metadata\s([A-Za-z0-9+/=]+)/);
        if (match && match[1]) {
            try {
                const decodedData = JSON.parse(atob(match[1]));
                workflow.value.steps = decodedData.steps;
                workflow.value.config = decodedData.config;
                workflow.value.name = decodedData.name;
                isManualEdit.value = false;
                activeTab.value = 'editor';
            } catch (e) { console.error("Metadata parse error"); }
        } else {
            manualCode.value = code;
            isManualEdit.value = true;
            activeTab.value = 'preview';
        }
    }

    async function handleRename(oldFile: string) {
        const newName = window.prompt(`Enter new name for the ${oldFile}:`, oldFile.replace('.ts', ''));
        if (!newName) return;

        const finalName = newName.endsWith('.ts') ? newName : `${newName}.ts`;
        if (finalName === oldFile) return;

        try {
            await invoke('rename_script', { oldName: oldFile, newName: finalName });

            if (currentOpenedPath.value === oldFile) {
                currentOpenedPath.value = finalName;
                workflow.value.name = newName;
            }

            await refreshSaved();
        } catch (err) {
            handleIncomingLog(`TASK:FAIL:SYSTEM:Rename failed: ${err}`);
        }
    }

    return {
        leftSidebarCollapsed, rightSidebarCollapsed, copiedSourceId, isModified, runningFilePath, showPropertyModal,
        STRATEGIES_BY_ACTION, activeTab, workflow, tasks, savedScripts, isProcessing, showConsole, showShortcutGuide,
        isManualEdit, manualCode, selectedStepIndex, clipboardStep, finalCode, activeStep, currentOpenedPath,
        history, redoStack, designerSearchQuery, isMoveMode, selectedFileIndex, isFullscreenConsole,
        saveHistory, undo, redo, moveStep, handleRename,
        handleCopy, handlePaste, handleIncomingLog, refreshSaved, handleRun, handleRunManual,
        handleSave, stopAutomation, handleDelete, loadScript, addStep, selectExcel,
        resetDesigner, cancelCopy, restoreTempTask
    };
}
