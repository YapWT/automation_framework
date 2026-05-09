<script setup lang="ts">
import { 
  Globe, Type, MousePointer2, Clock, Upload, Download, 
  Keyboard, FolderPlus, Move, FileSpreadsheet, CheckCircle, 
  XCircle, RotateCcw 
} from 'lucide-vue-next';

// Receive everything from the parent
const props = defineProps<{ 
  workflow: any 
}>();

const emit = defineEmits(['add-step', 'select-excel', 'reset-designer']);
</script>

<template>
  <aside class="sidebar-left">
    <div class="category">
      <label>Web Interactions</label>
      <div class="action-item" @click="emit('add-step', 'navigate')"><Globe size="16"/> Open URL</div>
      <div class="action-item" @click="emit('add-step', 'fill')"><Type size="16"/> Input Text</div>
      <div class="action-item" @click="emit('add-step', 'click')"><MousePointer2 size="16"/> Click Element</div>
      <div class="action-item" @click="emit('add-step', 'wait_for')"><Clock size="16"/> Wait for Element</div>
      <div class="action-item" @click="emit('add-step', 'upload')"><Upload size="16"/> Upload File</div>
      <div class="action-item" @click="emit('add-step', 'download')"><Download size="16"/> Download File</div>
    </div>

    <div class="category">
      <label>System & Keys</label>
      <div class="action-item" @click="emit('add-step', 'keyboard_press')"><Keyboard size="16"/> Key Press</div>
      <div class="action-item" @click="emit('add-step', 'mkdir')"><FolderPlus size="16"/> Create Folder</div>
      <div class="action-item" @click="emit('add-step', 'move')"><Move size="16"/> Move File</div>
    </div>

    <div class="category mt-auto pt-4 border-t">
      <label>Data Context</label>
      <button v-if="!workflow.config.useExcel" class="xl-sidebar-btn" @click="emit('select-excel')">
        <FileSpreadsheet size="16" /> Link Excel Data
      </button>
      <div v-else class="xl-sidebar-active" @click="emit('select-excel')">
        <div class="xl-info">
          <CheckCircle size="14" class="text-emerald-500" />
          <span class="truncate">{{ workflow.config.excelPath.split(/[\\/]/).pop() }}</span>
        </div>
        <XCircle size="14" class="xl-clear" @click.stop="workflow.config.useExcel = false" />
      </div>
      <button class="reset-designer-btn mt-3" @click="emit('reset-designer')">
        <RotateCcw size="14"/> Reset Designer
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Keep your existing sidebar styles here */
.sidebar-left { background: white; border-right: 1px solid #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; overflow-y: auto; z-index: 10; }
.category label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin: 1.5rem 0 0.5rem; letter-spacing: 0.05em; }
.action-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; color: #334155; margin-bottom: 4px; }
.action-item:hover { background: #f8fafc; color: #6366f1; transform: translateX(3px); }
.xl-sidebar-btn { width: 100%; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; color: #64748b; background: #f8fafc; font-size: 0.8rem; }
.xl-sidebar-active { width: 100%; padding: 10px; border: 1px solid #10b981; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: #ecfdf5; color: #065f46; font-size: 0.8rem; font-weight: 700; }
.xl-info { display: flex; align-items: center; gap: 6px; overflow: hidden; }
.reset-designer-btn { border: 1px solid #fee2e2; color: #ef4444; background: #fef2f2; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; }
</style>