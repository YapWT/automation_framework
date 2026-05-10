import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { message, ask, open } from '@tauri-apps/plugin-dialog';
import { Workflow, Task } from '../types/automation';
import { ScriptGenerator } from '../services/Generator';

export function useAutomation() {
    const activeTab = ref<'editor' | 'preview' | 'saved'>('editor');

    const workflow = ref({
        name: "automation_task",
        config: { excelPath: "", useExcel: false, headless: false },
        steps: [] as any[]
    });

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

    const finalCode = computed({
        get: () => isManualEdit.value ? manualCode.value : ScriptGenerator.generate(workflow.value),
        set: (val) => { manualCode.value = val; isManualEdit.value = true; }
    });

    const activeStep = computed(() =>
        selectedStepIndex.value !== null ? workflow.value.steps[selectedStepIndex.value] : null
    );

    const STRATEGIES_BY_ACTION: Record<string, any[]> = {
        fill: [{ id: 'textbox', label: 'Text Box / Input' }, { id: 'placeholder', label: 'By Hint' }, { id: 'label', label: 'By Label' }, { id: 'css', label: 'Advanced CSS' }],
        click: [{ id: 'button', label: 'Button' }, { id: 'link', label: 'Link' }, { id: 'checkbox', label: 'Checkbox' }, { id: 'radio', label: 'Radio Button' }, { id: 'text', label: 'Visible Text' }, { id: 'css', label: 'Advanced CSS' }],
        upload: [{ id: 'label', label: 'Label next to Upload' }, { id: 'textbox', label: 'Input Box' }],
        download: [{ id: 'button', label: 'Download Button' }, { id: 'link', label: 'Download Link' }],
        wait_for: [{ id: 'text', label: 'Visible Text' }, { id: 'textbox', label: 'Text Box' }, { id: 'button', label: 'Button' }, { id: 'css', label: 'Advanced CSS' }],
    };

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
            filters: [{ name: 'Data Source', extensions: ['xlsx', 'csv', 'xls'] }]
        });
        if (selected) {
            workflow.value.config.excelPath = selected as string;
            workflow.value.config.useExcel = true;
        }
    }

    function resetDesigner() {
        workflow.value.steps = [];
        selectedStepIndex.value = null;
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
        // Deep clone the step so changes to the original don't affect the copy
        clipboardStep.value = JSON.parse(JSON.stringify(step));
    }

    function handlePaste() {
        if (clipboardStep.value) {
            const newStep = JSON.parse(JSON.stringify(clipboardStep.value));
            // Assign a new unique ID
            newStep.id = Date.now();
            workflow.value.steps.push(newStep);
        }
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
            await invoke('save_permanent_script', { code: finalCode.value, filename: workflow.value.name });
            await refreshSaved();
            await message("Script saved successfully", { title: "Success" });
        } catch (err) {
            handleIncomingLog(`TASK:FAIL:Save failed: ${err}`);
        }
    }

    async function stopAutomation() {
        try {
            // 1. Tell Rust to kill the process tree
            await invoke('stop_script');

            // 2. Manually clean up UI state
            isProcessing.value = false;

            // 3. Mark the main runner as failed/stopped in the console
            handleIncomingLog("TASK:FAIL:EXECUTION:Stopped by User");

            // 4. Force all other running tasks to "error" state so spinners stop
            tasks.value.forEach(t => {
                if (t.status === 'running') t.status = 'error';
            });

        } catch (err) {
            console.error("Stop failed:", err);
        }
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
        const executionId = "EXECUTION";

        try {
            handleIncomingLog(`TASK:START:${executionId}:Running saved script: ${file}`);
            // This calls your Rust backend
            await invoke('execute_script', { filename: file });
        } catch (err) {
            handleIncomingLog(`TASK:FAIL:${executionId}:Failed to run ${file}`);
            isProcessing.value = false;
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
        const code = await invoke('read_script_content', { filename: file });
        manualCode.value = code as string;
        isManualEdit.value = true;
        activeTab.value = 'preview'; // Switch to editor
        workflow.value.name = file.replace('.ts', '');
    }

    return {
        leftSidebarCollapsed, rightSidebarCollapsed,
        STRATEGIES_BY_ACTION, activeTab, workflow, tasks, savedScripts, isRecording, isProcessing, showConsole,
        isManualEdit, manualCode, selectedStepIndex, clipboardStep, finalCode, activeStep,
        handleCopy, handlePaste, handleIncomingLog, refreshSaved, handleRun, handleRunManual,
        handleSave, stopAutomation, toggleRecording, handleDelete, loadScript, addStep, selectExcel,
        resetDesigner,
    };
}
