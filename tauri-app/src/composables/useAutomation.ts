import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { message, ask, open, save } from '@tauri-apps/plugin-dialog';
import { workflow, Task, STRATEGIES_BY_ACTION } from '../types/automation';
import { ScriptGenerator } from '../services/Generator';

export function useAutomation() {
    const activeTab = ref<'editor' | 'preview' | 'saved'>('editor');

    const tasks = ref<Task[]>([]);
    const savedScripts = ref<string[]>([]);
    const isRecording = ref(false);
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
    const lastSavedCode = ref(""); // Track code exactly as it is on disk
    const runningFilePath = ref<string | null>(null); // Track which file is executing

    // Computed to check if the current editor content differs from the disk version
    const isModified = computed(() => {
        if (!currentOpenedPath.value) return false;
        // Compare current generated/manual code with the baseline from the file
        return finalCode.value.trim() !== lastSavedCode.value.trim();
    });

    const finalCode = computed({
        get: () => isManualEdit.value ? manualCode.value : ScriptGenerator.generate(workflow.value),
        set: (val) => { manualCode.value = val; isManualEdit.value = true; }
    });

    const activeStep = computed(() =>
        selectedStepIndex.value !== null ? workflow.value.steps[selectedStepIndex.value] : null
    );

    function addStep(type: string) {
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

        workflow.value.steps.push({
            id: Date.now(),
            action: type,
            params: { ...defaults[type] }
        });
        selectedStepIndex.value = workflow.value.steps.length - 1;
    }

    async function selectExcel() {
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
        workflow.value.steps = [];
        selectedStepIndex.value = null;
        workflow.value.config.excelPath = "";
        workflow.value.config.useExcel = false;
        cancelCopy();
        currentOpenedPath.value = null;
    }

    function handleIncomingLog(rawLog: string) {
        const log = rawLog.trim();
        if (!log) return;

        // DEBUG: Add this to see if the log is even reaching this function
        console.log("Processing log:", log);

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
            // Fallback for system logs
            tasks.value.push({
                id: `sys-${Date.now()}`,
                label: log,
                status: 'success'
            });
        }
    } async function refreshSaved() {
        savedScripts.value = await invoke('list_saved_scripts');
    }

    function handleCopy(step: any) {
        clipboardStep.value = JSON.parse(JSON.stringify(step));
        copiedSourceId.value = step.id; // Store the ID of the original card
    }

    function handlePaste(index?: number) {
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

            // CRITICAL: Auto-select the newly pasted card
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
        } catch (err) {
            handleIncomingLog(`TASK:FAIL:EXECUTION:Failed to start`);
            isProcessing.value = false;
        }
    }

    async function handleSave() {
        try {
            const selectedPath = await save({
                title: 'Save Automation Script',
                defaultPath: currentOpenedPath.value || `${workflow.value.name}.ts`,
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

            // SYNC: Update last saved code to clear the "Modified" hint
            lastSavedCode.value = finalCode.value;
            isModified.value;

            await refreshSaved();
            await message("Script saved successfully", { title: "Success", kind: "info" });
        } catch (err) {
            handleIncomingLog(`TASK:FAIL:SYSTEM:Save failed: ${err}`);
        }
    }

    async function stopAutomation() {
        try {
            await invoke('stop_script');
            isProcessing.value = false;
            runningFilePath.value = null; // CLEAR the running hint on terminate

            handleIncomingLog("TASK:FAIL:EXECUTION:Terminated by User");
            tasks.value.forEach(t => {
                if (t.status === 'running') t.status = 'error';
            });
        } catch (err) { console.error(err); }
    }

    async function toggleRecording() {
        try {
            if (!isRecording.value) {
                await invoke('start_global_recording');
                isRecording.value = true;
                tasks.value = [];
                handleIncomingLog("TASK:START:Global Recording Active");
            } else {
                const events: any[] = await invoke('stop_global_recording');
                isRecording.value = false;
                await invoke('export_to_automation_script', { filename: workflow.value.name });
                await refreshSaved();
                handleIncomingLog(`TASK:DONE:Saved ${events.length} events`);
            }
        } catch (err) { isRecording.value = false; }
    }

    async function handleRunManual(file: string) {
        tasks.value = [];
        showConsole.value = true;
        isProcessing.value = true;
        runningFilePath.value = file; // Set hint to RUNNING

        try {
            handleIncomingLog(`TASK:START:EXECUTION:Running script: ${file}`);
            await invoke('execute_script', { filename: file });
        } catch (err) {
            isProcessing.value = false;
            runningFilePath.value = null; // Clear hint if failed to start
        }
    }

    async function restoreTempTask() {
        try {
            const code = await invoke('read_script_content', { filename: 'temp_task.ts' }) as string;
            if (!code || code.trim() === "") return;

            // Use the same metadata regex from loadScript
            const match = code.match(/@metadata\s([A-Za-z0-9+/=]+)/);

            if (match && match[1]) {
                const decodedData = JSON.parse(atob(match[1]));

                // Only restore if there are actually steps (don't overwrite default empty state with nothing)
                if (decodedData.steps && decodedData.steps.length > 0) {
                    workflow.value.steps = decodedData.steps;
                    workflow.value.config = decodedData.config;
                    workflow.value.name = decodedData.name || "recovered_task";
                    // Stay in editor mode so user sees their cards
                    activeTab.value = 'editor';
                    console.log("Restored unsaved progress from temp_task.ts");
                }
            }
        } catch (e) {
            // Temp file might not exist yet, which is fine
            console.log("No previous temp session found.");
        }
    }

    async function handleDelete(file: string) {
        const confirmed = await ask(`Are you sure you want to delete ${file}?`, {
            title: 'Confirm Delete',
            kind: 'warning',
        });

        if (confirmed) {
            try {
                await invoke('delete_script', { filename: file });
                await refreshSaved(); // Refresh the grid
                await message("File deleted successfully", { title: "Success" });
            } catch (err) {
                handleIncomingLog(`TASK:FAIL:SYSTEM:Failed to delete: ${err}`);
            }
        }
    }

    async function loadScript(file: string) {
        const code = await invoke('read_script_content', { filename: file }) as string;

        currentOpenedPath.value = file;
        lastSavedCode.value = code; // Snapshot the file content

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

    return {
        leftSidebarCollapsed, rightSidebarCollapsed, copiedSourceId, isModified, runningFilePath,
        STRATEGIES_BY_ACTION, activeTab, workflow, tasks, savedScripts, isRecording, isProcessing, showConsole,
        isManualEdit, manualCode, selectedStepIndex, clipboardStep, finalCode, activeStep, currentOpenedPath,
        handleCopy, handlePaste, handleIncomingLog, refreshSaved, handleRun, handleRunManual,
        handleSave, stopAutomation, toggleRecording, handleDelete, loadScript, addStep, selectExcel,
        resetDesigner, cancelCopy, restoreTempTask
    };
}
