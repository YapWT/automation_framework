<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  Play, Save, Plus, Trash2, Globe, FileSpreadsheet, 
  MousePointer2, Type, Download, Move, FolderPlus, FileCode, Settings2, Zap
} from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import { open, message } from '@tauri-apps/plugin-dialog';
import { ScriptGenerator } from '../services/Generator';

// 1. State Management
const workflow = ref({
  name: "new_automation_task",
  config: { excelPath: "", useExcel: false, headless: false },
  steps: [] as any[]
});

const activeTab = ref<'editor' | 'preview'>('editor');
const selectedStepIndex = ref<number | null>(null);
const generatedCode = computed(() => ScriptGenerator.generate(workflow.value));

// 2. Auto-Save Watcher
watch(workflow, async (newVal) => {
  await invoke('auto_save_temp', { code: ScriptGenerator.generate(newVal) });
}, { deep: true });

// 3. Category Definitions
const webActions = [
  { id: 'navigate', label: 'Open URL', icon: Globe, color: 'text-blue-500' },
  { id: 'fill', label: 'Input Text', icon: Type, color: 'text-emerald-500' },
  { id: 'click', label: 'Click Element', icon: MousePointer2, color: 'text-orange-500' },
  { id: 'download', label: 'Download File', icon: Download, color: 'text-purple-500' },
];

const systemActions = [
  { id: 'mkdir', label: 'Create Folder', icon: FolderPlus, color: 'text-amber-500' },
  { id: 'move', label: 'Move/Rename', icon: Move, color: 'text-slate-500' },
];

// 4. Methods
function addStep(type: string) {
  const defaults: any = {
    navigate: { url: 'https://' },
    fill: { selector: '', value: '' },
    click: { selector: '' },
    download: { selector: '', path: './downloads' },
    mkdir: { path: '' },
    move: { from: '', to: '' }
  };
  workflow.value.steps.push({ id: Date.now(), action: type, params: { ...defaults[type] } });
  selectedStepIndex.value = workflow.value.steps.length - 1;
}

async function selectExcel() {
  const selected = await open({ multiple: false, filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (selected) {
    workflow.value.config.excelPath = selected as string;
    workflow.value.config.useExcel = true;
  }
}

async function handlePermanentSave() {
  try {
    const res = await invoke('save_permanent_script', { code: generatedCode.value, filename: workflow.value.name });
    await message(res as string);
  } catch (err) { await message(String(err), { title: 'Error', kind: 'error' }); }
}

async function handleRun(isTemp: boolean) {
  const fileName = isTemp ? "temp_task.ts" : `${workflow.value.name}.ts`;
  try {
    const res = await invoke('execute_script', { filename: fileName });
    await message(res as string);
  } catch (err) { await message(String(err), { title: 'Execution Error', kind: 'error' }); }
}

const activeStep = computed(() => selectedStepIndex.value !== null ? workflow.value.steps[selectedStepIndex.value] : null);
</script>

<template>
  <div class="editor-layout">
    <!-- LEFT: Action Library -->
    <aside class="sidebar-left">
      <div class="category">
        <label>Browser Actions</label>
        <div v-for="a in webActions" :key="a.id" class="action-item" @click="addStep(a.id)">
          <component :is="a.icon" :class="a.color" size="18" />
          <span>{{ a.label }}</span>
          <Plus size="14" class="plus" />
        </div>
      </div>
      <div class="category">
        <label>File Operations</label>
        <div v-for="a in systemActions" :key="a.id" class="action-item" @click="addStep(a.id)">
          <component :is="a.icon" :class="a.color" size="18" />
          <span>{{ a.label }}</span>
          <Plus size="14" class="plus" />
        </div>
      </div>
    </aside>

    <!-- CENTER: Canvas / Code View -->
    <main class="main-canvas">
      <header class="toolbar">
        <div class="tab-switcher">
          <button :class="{ active: activeTab === 'editor' }" @click="activeTab = 'editor'"><Settings2 size="16"/> Designer</button>
          <button :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'"><FileCode size="16"/> Code</button>
        </div>
        <div class="actions">
          <input v-model="workflow.name" class="name-input" placeholder="Task name..." />
          <button @click="handlePermanentSave" class="btn-save"><Save size="16"/> Save</button>
          <button @click="handleRun(true)" class="btn-test"><Zap size="16"/> Test</button>
          <button @click="handleRun(false)" class="btn-run"><Play size="16"/> Run Saved</button>
        </div>
      </header>

      <section v-if="activeTab === 'editor'" class="canvas-content">
        <div v-if="workflow.steps.length === 0" class="empty-placeholder">
          <p>Your workflow is empty. Add steps from the library.</p>
        </div>
        <div v-for="(step, i) in workflow.steps" :key="step.id" 
             class="step-node" :class="{ active: selectedStepIndex === i }" @click="selectedStepIndex = i">
          <div class="step-badge">{{ i + 1 }}</div>
          <div class="step-meta">
            <span class="step-action">{{ step.action.toUpperCase() }}</span>
            <span class="step-detail">{{ Object.values(step.params).join(' ') || '...' }}</span>
          </div>
          <button class="btn-delete" @click.stop="workflow.steps.splice(i, 1)"><Trash2 size="16" /></button>
        </div>
      </section>

      <section v-else class="code-view">
        <pre><code>{{ generatedCode }}</code></pre>
      </section>
    </main>

    <!-- RIGHT: Properties Panel -->
    <aside class="sidebar-right">
      <div class="prop-panel">
        <h3>Task Config</h3>
        <button class="excel-btn" @click="selectExcel">
          <FileSpreadsheet size="16" /> {{ workflow.config.useExcel ? 'Excel Connected' : 'Static (No Excel)' }}
        </button>
        <div class="checkbox-row">
          <input type="checkbox" v-model="workflow.config.headless" id="headless" />
          <label for="headless">Hide Browser (Headless)</label>
        </div>
      </div>
      <hr />
      <div v-if="activeStep" class="prop-panel">
        <h3>Step Details</h3>
        <div v-for="(val, key) in activeStep.params" :key="key" class="field-group">
          <label>{{ key.toUpperCase() }}</label>
          <input v-model="activeStep.params[key]" placeholder="Value or {{ColName}}" />
        </div>
      </div>
      <div v-else class="empty-hint">Select a step to configure details</div>
    </aside>
  </div>
</template>

<style scoped>
.editor-layout { display: grid; grid-template-columns: 240px 1fr 300px; height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; }

/* Sidebars */
.sidebar-left, .sidebar-right { background: white; border-right: 1px solid #e2e8f0; padding: 1.5rem; overflow-y: auto; }
.sidebar-right { border-right: none; border-left: 1px solid #e2e8f0; }

.category label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 0.75rem; }
.action-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; }
.action-item:hover { background: #f8fafc; color: #6366f1; }
.plus { margin-left: auto; opacity: 0.2; }

/* Toolbar */
.toolbar { height: 64px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
.tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; }
.tab-switcher button { border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; gap: 6px; }
.tab-switcher button.active { background: white; color: #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.actions { display: flex; gap: 8px; }
.name-input { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; font-size: 0.85rem; width: 140px; }
.btn-save { background: #10b981; color: white; border: none; border-radius: 8px; padding: 0 12px; cursor: pointer; font-weight: 600; display: flex; gap: 6px; align-items: center; font-size: 0.8rem; }
.btn-test { background: #f59e0b; color: white; border: none; border-radius: 8px; padding: 0 12px; cursor: pointer; font-weight: 600; display: flex; gap: 6px; align-items: center; font-size: 0.8rem; }
.btn-run { background: #6366f1; color: white; border: none; border-radius: 8px; padding: 0 12px; cursor: pointer; font-weight: 600; display: flex; gap: 6px; align-items: center; font-size: 0.8rem; }

/* Canvas */
.canvas-content { padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; align-items: center; flex-grow: 1; }
.step-node { background: white; width: 100%; max-width: 600px; padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; cursor: pointer; border: 2px solid transparent; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.step-node.active { border-color: #6366f1; }
.step-badge { width: 28px; height: 28px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; }
.step-action { font-weight: 800; font-size: 0.8rem; color: #334155; display: block; }
.step-detail { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }
.btn-delete { margin-left: auto; background: none; border: none; color: #ef4444; opacity: 0.4; cursor: pointer; }
.btn-delete:hover { opacity: 1; }

.code-view { background: #0f172a; color: #e2e8f0; padding: 1.5rem; flex-grow: 1; overflow: auto; font-family: 'Fira Code', monospace; font-size: 0.8rem; line-height: 1.6; }

/* Right Panel */
.prop-panel h3 { font-size: 0.85rem; margin-bottom: 1rem; color: #475569; }
.excel-btn { width: 100%; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 10px; cursor: pointer; display: flex; gap: 10px; justify-content: center; font-size: 0.8rem; margin-bottom: 1rem; }
.checkbox-row { display: flex; gap: 10px; align-items: center; font-size: 0.75rem; color: #64748b; }
.field-group { margin-bottom: 1rem; }
.field-group label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; }
.field-group input { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; }
hr { border: none; border-top: 1px solid #f1f5f9; margin: 1.5rem 0; }
</style>
