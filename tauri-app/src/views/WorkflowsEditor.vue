<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  Play, Save, Plus, Trash2, Globe, FileSpreadsheet, MousePointer2, Copy, Clipboard, CheckCircle,
  Type, Download, Move, FolderPlus, FileCode, Settings2, Zap, Info, GripVertical, Upload, Keyboard, Clock, Terminal, ChevronDown, RotateCcw, FolderSearch, XCircle
} from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open, message } from '@tauri-apps/plugin-dialog';
import { ScriptGenerator } from '../services/Generator';

// 1. State
const workflow = ref({
  name: "automation_task",
  config: { excelPath: "", useExcel: false, headless: false },
  steps: [] as any[]
});

const activeTab = ref<'editor' | 'preview' | 'saved'>('editor');
const selectedStepIndex = ref<number | null>(null);
const logs = ref<string[]>([]);
const showConsole = ref(false);
const manualCode = ref("");
const isManualEdit = ref(false);
const savedScripts = ref<string[]>([]);
const clipboardStep = ref<any>(null);

const finalCode = computed({
  get: () => isManualEdit.value ? manualCode.value : ScriptGenerator.generate(workflow.value),
  set: (val) => { manualCode.value = val; isManualEdit.value = true; }
});

// 2. Action Logic / Property Maps
const strategiesByAction: Record<string, any[]> = {
  fill: [{ id: 'textbox', label: 'Text Box / Input' }, { id: 'placeholder', label: 'By Hint' }, { id: 'label', label: 'By Label' }, { id: 'css', label: 'Advanced CSS' }],
  click: [{ id: 'button', label: 'Button' }, { id: 'link', label: 'Link' }, { id: 'checkbox', label: 'Checkbox' }, { id: 'radio', label: 'Radio Button' }, { id: 'text', label: 'Visible Text' }, { id: 'css', label: 'Advanced CSS' }],
  upload: [{ id: 'label', label: 'Label next to Upload' }, { id: 'textbox', label: 'Input Box' }],
  download: [{ id: 'button', label: 'Download Button' }, { id: 'link', label: 'Download Link' }],
  wait_for: [{ id: 'text', label: 'Visible Text' }, { id: 'textbox', label: 'Text Box' }, { id: 'button', label: 'Button' }],
};

// 3. Methods
function handleCopy(step: any) {
  clipboardStep.value = JSON.parse(JSON.stringify(step)); // Capture Deep Clone
}

function handlePaste() {
  if (clipboardStep.value) {
    const newStep = JSON.parse(JSON.stringify(clipboardStep.value)); // Unique memory reference
    newStep.id = Date.now();
    workflow.value.steps.push(newStep);
  }
}

async function browse(step: any, key: string, isFolder: boolean) {
  const selected = await open({ directory: isFolder, multiple: false });
  if (selected) step.params[key] = selected as string;
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

async function loadScript(file: string) {
  const code = await invoke('read_script_content', { filename: file });
  manualCode.value = code as string; 
  isManualEdit.value = true; 
  activeTab.value = 'preview'; 
  workflow.value.name = file.replace('.ts', '');
}

function addStep(type: string) {
  isManualEdit.value = false;
  const defaults: any = {
    navigate: { url: 'https://' },
    wait_for: { matchBy: 'text', selector: '', timeout: 30000, index: 0 },
    fill: { matchBy: 'textbox', selector: '', value: '', exact: false, force: false, timeout: 30000, index: 0 },
    click: { matchBy: 'button', selector: '', exact: false, force: false, timeout: 30000, index: 0 },
    keyboard_press: { key: 'Enter' },
    upload: { matchBy: 'label', selector: '', path: '', index: 0 },
    download: { matchBy: 'button', selector: '', path: './downloads', exact: false, index: 0 },
    mkdir: { path: '' },
    move: { from: '', to: '' }
  };
  workflow.value.steps.push({ id: Date.now(), action: type, params: { ...defaults[type] } });
  selectedStepIndex.value = workflow.value.steps.length - 1;
}

async function handleRun(isTemp: boolean) {
  logs.value = []; showConsole.value = true;
  const name = isTemp ? "temp_task.ts" : `${workflow.value.name}.ts`;
  try { await invoke('execute_script', { filename: name }); } 
  catch (err) { logs.value.push("Error: " + err); }
}

onMounted(async () => {
  savedScripts.value = await invoke('list_saved_scripts');
  await listen('automation-log', (e) => {
    logs.value.push(e.payload as string);
    const el = document.getElementById('console-body');
    if (el) el.scrollTop = el.scrollHeight;
  });
});

watch(finalCode, async (val) => { await invoke('auto_save_temp', { code: val }); });
const activeStep = computed(() => selectedStepIndex.value !== null ? workflow.value.steps[selectedStepIndex.value] : null);
</script>

<template>
  <div class="editor-layout">
    <!-- LEFT SIDEBAR -->
    <aside class="sidebar-left">
      <div class="category">
        <label>Web Interactions</label>
        <div class="action-item" @click="addStep('navigate')"><Globe size="16"/> Open URL</div>
        <div class="action-item" @click="addStep('fill')"><Type size="16"/> Input Text</div>
        <div class="action-item" @click="addStep('click')"><MousePointer2 size="16"/> Click Element</div>
        <div class="action-item" @click="addStep('wait_for')"><Clock size="16"/> Wait for Element</div>
        <div class="action-item" @click="addStep('upload')"><Upload size="16"/> Upload File</div>
        <div class="action-item" @click="addStep('download')"><Download size="16"/> Download File</div>
      </div>
      <div class="category">
        <label>System & Keys</label>
        <div class="action-item" @click="addStep('keyboard_press')"><Keyboard size="16"/> Key Press</div>
        <div class="action-item" @click="addStep('mkdir')"><FolderPlus size="16"/> Create Folder</div>
        <div class="action-item" @click="addStep('move')"><Move size="16"/> Move File</div>
      </div>

      <!-- EXCEL LINK BOTTOM LEFT -->
      <div class="category mt-auto pt-4 border-t">
        <label>Data Context</label>
        <button v-if="!workflow.config.useExcel" class="xl-sidebar-btn" @click="selectExcel">
          <FileSpreadsheet size="16" /> Link Excel Data
        </button>
        <div v-else class="xl-sidebar-active" @click="selectExcel">
          <div class="xl-info">
            <CheckCircle size="14" class="text-emerald-500" />
            <span class="truncate">{{ workflow.config.excelPath.split(/[\\/]/).pop() }}</span>
          </div>
          <XCircle size="14" class="xl-clear" @click.stop="workflow.config.useExcel = false" />
        </div>
        <button class="reset-designer-btn mt-3" @click="workflow.steps = []"><RotateCcw size="14"/> Reset Designer</button>
      </div>
    </aside>

    <!-- CENTER AREA -->
    <main class="main-canvas">
      <!-- HEADER TOOLBAR (Fixed Alignment) -->
      <header class="toolbar">
        <div class="tab-switcher">
          <button :class="{ active: activeTab === 'editor' }" @click="activeTab = 'editor'">Designer</button>
          <button :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">Script Editor</button>
          <button :class="{ active: activeTab === 'saved' }" @click="activeTab = 'saved'; refreshSaved()">Saved</button>
        </div>
        
        <div class="controls-row">
          <input v-model="workflow.name" class="task-name-input" placeholder="Task Name" />
          <div class="button-group">
            <button @click="showConsole = !showConsole" class="tool-icon-btn" :class="{ active: showConsole }"><Terminal size="18"/></button>
            <button @click="handleRun(true)" class="action-btn test-btn"><Zap size="14"/> Test Run</button>
            <button @click="invoke('save_permanent_script', { code: finalCode, filename: workflow.name }).then(refreshSaved)" class="action-btn save-btn"><Save size="14"/> Save Script</button>
          </div>
        </div>
      </header>

      <!-- CANVAS CONTENT -->
      <section v-if="activeTab === 'editor'" class="canvas-content">
        <div v-if="workflow.steps.length === 0" class="empty-state">
           <Settings2 size="48" class="mb-4 opacity-10" />
           <p>Choose an interaction on the left to start building.</p>
        </div>
        
        <draggable v-model="workflow.steps" item-key="id" handle=".handle" class="drag-list" @start="selectedStepIndex = null">
          <template #item="{ element, index }">
            <div class="step-card" :class="{ active: selectedStepIndex === index }" @click="selectedStepIndex = index">
              <div class="handle"><GripVertical size="16"/></div>
              <div class="step-badge">{{ index + 1 }}</div>
              <div class="step-info">
                <span class="step-type">{{ element.action.toUpperCase() }}</span>
                <span class="step-desc">{{ element.params.selector || element.params.url || element.params.key || '...' }}</span>
              </div>
              <div class="step-tools">
                <button class="step-tool-btn" @click.stop="handleCopy(element)"><Copy size="14"/></button>
                <button class="step-tool-btn del" @click.stop="workflow.steps.splice(index, 1)"><Trash2 size="14"/></button>
              </div>
            </div>
          </template>
        </draggable>
        <button v-if="clipboardStep" class="paste-fab" @click="handlePaste"><Clipboard size="14"/> Paste Step</button>
      </section>

      <!-- PREVIEW SECTION -->
      <section v-else-if="activeTab === 'preview'" class="code-view">
        <div class="code-banner" v-if="isManualEdit">
          <span>Manual Editing Mode Active</span>
          <button @click="isManualEdit = false">Reset to Designer</button>
        </div>
        <codemirror v-model="finalCode" :extensions="[javascript(), oneDark]" :style="{ height: '100%' }" />
      </section>

      <!-- SAVED VIEW -->
      <section v-else class="saved-view">
        <div class="saved-grid">
          <div v-for="file in savedScripts" :key="file" class="saved-card">
            <FileCode size="20" class="text-indigo-500" />
            <span class="file-name">{{ file }}</span>
            <div class="file-ops">
              <button @click="loadScript(file)">Load</button>
              <button class="run-btn" @click="invoke('execute_script', { filename: file })">Run</button>
            </div>
          </div>
        </div>
      </section>

      <!-- CONSOLE DRAWER -->
      <transition name="slide">
        <div v-if="showConsole" class="console-drawer">
          <div class="console-header"><span>AUTOMATION LOGS</span><button @click="showConsole = false"><ChevronDown size="16"/></button></div>
          <div id="console-body" class="console-body">
            <div v-for="(log, i) in logs" :key="i" :class="{ 'err': log.includes('Error') }">> {{ log }}</div>
          </div>
        </div>
      </transition>
    </main>

    <!-- RIGHT SIDEBAR: PROPERTIES (Fixed Tag Design) -->
    <aside class="sidebar-right">
      <div v-if="activeStep" class="prop-container">
        <!-- HEADER WITH ACTION TAG RESTORED -->
        <div class="prop-section-header">
          <h3>Properties</h3>
          <span class="action-tag">{{ activeStep.action.toUpperCase() }}</span>
        </div>

        <div v-if="activeStep.params.index !== undefined" class="input-group">
          <label>Element Index (0 = 1st)</label>
          <input type="number" v-model="activeStep.params.index" min="0" class="styled-input" />
        </div>

        <div v-if="strategiesByAction[activeStep.action]" class="input-group">
          <label>Find element by:</label>
          <select v-model="activeStep.params.matchBy" class="styled-select">
            <option v-for="opt in strategiesByAction[activeStep.action]" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
          <div class="check-row mt-3" v-if="activeStep.params.exact !== undefined">
            <input type="checkbox" v-model="activeStep.params.exact" id="ex-chk" />
            <label for="ex-chk">Strict Case Match</label>
          </div>
          <div class="check-row" v-if="activeStep.params.force !== undefined">
            <input type="checkbox" v-model="activeStep.params.force" id="fc-chk" />
            <label for="fc-chk">Force Action</label>
          </div>
        </div>

        <div v-for="(val, key) in activeStep.params" :key="key">
          <div v-if="!['matchBy', 'exact', 'force', 'timeout', 'index'].includes(key)" class="input-group">
            <div class="label-row">
              <label>{{ key.toUpperCase() }}</label>
              <button v-if="['path', 'from', 'to'].includes(key)" class="browse-link" @click="browse(activeStep, key, activeStep.action === 'mkdir')">
                <FolderSearch size="12" /> Browse
              </button>
            </div>
            
            <select v-if="key === 'key'" v-model="activeStep.params[key]" class="styled-select">
              <option value="Enter">Enter</option><option value="Tab">Tab</option><option value="Escape">Escape</option>
              <option value="ArrowDown">Down</option><option value="ArrowUp">Up</option><option value="Backspace">Backspace</option>
            </select>
            <textarea v-else v-model="activeStep.params[key]" rows="4" class="styled-textarea" placeholder="Enter value..."></textarea>
          </div>
        </div>
        <div class="tip-box" v-pre><Info size="14" /><span>Use <b>{{ColumnName}}</b> for data.</span></div>
      </div>
      <div v-else class="empty-props">
        <MousePointer2 size="32" class="opacity-10 mb-2" />
        <p>Select a step to configure properties</p>
      </div>

      <div class="sidebar-footer">
        <div class="check-row">
          <input type="checkbox" v-model="workflow.config.headless" id="hd-chk" />
          <label for="hd-chk" class="text-[10px] font-bold text-slate-400 uppercase">Run Headless</label>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.editor-layout { display: grid; grid-template-columns: 240px 1fr 300px; height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; overflow: hidden; }

/* SIDEBARS */
.sidebar-left, .sidebar-right { background: white; border-right: 1px solid #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; overflow-y: auto; z-index: 10; }
.sidebar-right { border-left: 1px solid #e2e8f0; border-right: none; }

.category label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin: 1.5rem 0 0.5rem; letter-spacing: 0.05em; }
.action-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; color: #334155; margin-bottom: 4px; }
.action-item:hover { background: #f8fafc; color: #6366f1; transform: translateX(3px); }

/* EXCEL DYNAMIC LINK BUTTON */
.xl-sidebar-btn { width: 100%; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; color: #64748b; background: #f8fafc; font-size: 0.8rem; }
.xl-sidebar-btn:hover { border-color: #6366f1; color: #6366f1; }
.xl-sidebar-active { width: 100%; padding: 10px; border: 1px solid #10b981; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: #ecfdf5; color: #065f46; font-size: 0.8rem; font-weight: 700; }
.xl-info { display: flex; align-items: center; gap: 6px; overflow: hidden; }

/* TOOLBAR ALIGNMENT */
.toolbar { height: 64px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: 0 1.25rem; flex-shrink: 0; }
.tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 2px; }
.tab-switcher button { border: none; padding: 6px 14px; border-radius: 7px; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #64748b; }
.tab-switcher button.active { background: white; color: #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.controls-row { display: flex; align-items: center; gap: 12px; height: 40px; }
.button-group { display: flex; align-items: center; gap: 8px; }
.task-name-input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 0.85rem; width: 140px; height: 36px; outline: none; transition: 0.2s; }
.task-name-input:focus { border-color: #6366f1; }

.action-btn { border: none; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; color: white; transition: 0.2s; }
.test-btn { background: #f59e0b; }
.save-btn { background: #6366f1; }
.tool-icon-btn { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
.tool-icon-btn.active { background: #334155; color: white; }

/* CANVAS */
.canvas-content { padding: 2rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; align-items: center; background: #f8fafc; }
.drag-list { width: 100%; max-width: 650px; }
.step-card { background: white; padding: 1.25rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; width: 100%; }
.step-card.active { border-color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08); }
.step-badge { width: 26px; height: 26px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: #6366f1; flex-shrink: 0; }
.step-info { flex: 1; overflow: hidden; }
.step-type { font-weight: 800; font-size: 0.7rem; color: #94a3b8; display: block; text-transform: uppercase; }
.step-desc { font-size: 0.85rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'JetBrains Mono', monospace; }
.step-tools { display: flex; gap: 4px; opacity: 0; transition: 0.2s; }
.step-card:hover .step-tools { opacity: 1; }
.step-tool-btn { background: none; border: none; padding: 6px; cursor: pointer; color: #94a3b8; transition: 0.2s; }
.step-tool-btn:hover { color: #6366f1; }

/* PROPERTIES HEADER & TAG */
.prop-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.prop-section-header h3 { font-size: 0.9rem; color: #1e293b; font-weight: 800; margin: 0; }
.action-tag { background: #f1f5f9; color: #6366f1; font-size: 0.65rem; padding: 3px 10px; border-radius: 20px; font-weight: 800; text-transform: uppercase; }

/* INPUTS */
.input-group { margin-bottom: 1.25rem; }
.input-group label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 6px; }
.styled-input, .styled-select, .styled-textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; outline: none; }
.styled-textarea { resize: vertical; min-height: 80px; font-family: inherit; line-height: 1.5; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
.browse-link { background: #f1f5f9; border: none; color: #6366f1; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; cursor: pointer; }
.check-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.8rem; color: #64748b; font-weight: 500; }

.sidebar-footer { padding-top: 1.25rem; margin-top: auto; border-top: 1px solid #f1f5f9; }
.reset-designer-btn { border: 1px solid #fee2e2; color: #ef4444; background: #fef2f2; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; }

.console-drawer { position: absolute; bottom: 0; left: 0; right: 0; height: 260px; background: #1e293b; color: #cbd5e1; z-index: 50; display: flex; flex-direction: column; box-shadow: 0 -8px 24px rgba(0,0,0,0.15); }
.console-header { padding: 10px 16px; background: #0f172a; display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; color: #94a3b8; }
.console-body { flex: 1; padding: 16px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; line-height: 1.6; }
.tip-box { background: #f0f9ff; padding: 12px; border-radius: 10px; font-size: 0.7rem; color: #0369a1; display: flex; gap: 10px; margin-top: 1.5rem; border: 1px solid #bae6fd; }

.paste-fab { margin-top: 1.5rem; background: #f5f3ff; color: #7c3aed; border: 1px dashed #7c3aed; padding: 10px 24px; border-radius: 12px; cursor: pointer; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }

.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateY(100%); }
</style>
