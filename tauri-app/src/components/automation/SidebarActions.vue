<script setup lang="ts">
import { 
  Globe, Type, MousePointer2, Clock, Upload, Download, 
  Keyboard, FolderPlus, Move, FileSpreadsheet, CheckCircle, 
  XCircle, RotateCcw, ChevronLeft, ChevronRight 
} from 'lucide-vue-next';

defineProps<{ workflow: any, collapsed: boolean }>();
const emit = defineEmits(['add-step', 'select-excel', 'reset-designer', 'toggle']);
</script>

<template>
  <aside class="sidebar-left" :class="{ 'is-collapsed': collapsed }">
    <div class="header-section">
      <span v-if="!collapsed" class="brand">ACTIONS</span>
      <button class="toggle-btn" @click="emit('toggle')" :title="collapsed ? 'Expand' : 'Collapse'">
        <component :is="collapsed ? ChevronRight : ChevronLeft" size="16" />
      </button>
    </div>

    <div class="scroll-area">
      <!-- CATEGORY 1: WEB -->
      <div class="category">
        <label v-if="!collapsed">Web Interactions</label>
        <div class="action-item" @click="emit('add-step', 'navigate')" title="Open URL">
          <Globe size="18"/> <span v-if="!collapsed">Open URL</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'fill')" title="Input Text">
          <Type size="18"/> <span v-if="!collapsed">Input Text</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'click')" title="Click Element">
          <MousePointer2 size="18"/> <span v-if="!collapsed">Click Element</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'wait_for')" title="Wait for Element">
          <Clock size="18"/> <span v-if="!collapsed">Wait for Element</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'upload')" title="Upload File">
           <Upload size="18"/> <span v-if="!collapsed">Upload File</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'download')" title="Download File">
          <Download size="18"/> <span v-if="!collapsed">Download File</span>
        </div>
      </div>

      <div class="separator"></div>

      <!-- CATEGORY 2: SYSTEM -->
      <div class="category">
        <label v-if="!collapsed">System & Keys</label>
        <div class="action-item" @click="emit('add-step', 'keyboard_press')" title="Key Press">
          <Keyboard size="18"/> <span v-if="!collapsed">Key Press</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'mkdir')" title="Create Folder">
          <FolderPlus size="18"/> <span v-if="!collapsed">Create Folder</span>
        </div>
        <div class="action-item" @click="emit('add-step', 'move')" title="Move File">
          <Move size="18"/> <span v-if="!collapsed">Move File</span>
        </div>
      </div>

      <div class="separator"></div>

      <!-- CATEGORY 3: DATA CONTEXT -->
      <div class="footer-actions mt-auto">
        <label v-if="!collapsed">Data Context</label>
        
        <!-- Both states now share the same 'xl-btn-base' class to lock size -->
        <button v-if="!workflow.config.useExcel" class="xl-btn-base xl-sidebar-btn" @click="emit('select-excel')" title="Link Excel">
          <FileSpreadsheet size="18" /> <span v-if="!collapsed" class="ml-3">Link Excel</span>
        </button>
        
        <div v-else class="xl-btn-base xl-sidebar-active" @click="emit('select-excel')">
          <div class="flex items-center flex-1 overflow-hidden">
            <CheckCircle size="16" class="text-emerald-500 shrink-0" />
            <span v-if="!collapsed" class="truncate ml-3">{{ workflow.config.excelPath.split(/[\\/]/).pop() }}</span>
          </div>
          <XCircle v-if="!collapsed" size="14" class="xl-clear ml-2 shrink-0" @click.stop="workflow.config.useExcel = false" />
        </div>

        <button class="reset-designer-btn mt-2" @click="emit('reset-designer')" title="Reset Designer">
          <RotateCcw size="16"/> <span v-if="!collapsed">Reset All</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.toggle-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #94a3b8; /* Indigo-500 */
  color: white;
}

.sidebar-left { background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; height: 100%; transition: width 0.3s ease; width: 100%; }
.header-section { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #f1f5f9; }
.brand { font-size: 0.65rem; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; }
/* .toggle-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px; cursor: pointer; color: #64748b; }*/
.scroll-area { flex: 1; overflow-y: auto; padding: 1rem; }

.separator { height: 1px; background: #f1f5f9; margin: 1.25rem 0; }

.category label, .footer-actions label { font-size: 0.65rem; font-weight: 800; color: #cbd5e1; text-transform: uppercase; display: block; margin: 0 0 0.5rem; }
.action-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: #334155; margin-bottom: 2px; transition: 0.2s; }
.action-item:hover { background: #f1f5f9; color: #6366f1; }

.is-collapsed .scroll-area { padding: 1rem 0.5rem; }
.is-collapsed .action-item { justify-content: center; }

/* DATA CONTEXT COMPONENT STYLES */
.xl-btn-base {
  width: 100%;
  height: 40px; /* Lock height so it never changes size */
  padding: 0 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s;
  border: 1px solid transparent;
  box-sizing: border-box;
  cursor: pointer;
  line-height: 1;
}

.xl-sidebar-btn { 
  border: 1px dashed #cbd5e1; 
  color: #64748b; 
  background: transparent; 
  justify-content: flex-start;
}
.xl-sidebar-btn:hover { background: #f1f5f9; color: #6366f1; border-color: #6366f1; }

.xl-sidebar-active { 
  border: 1px solid #10b981; 
  background: #ecfdf5; 
  color: #065f46; 
}
.xl-sidebar-active:hover { background: #d1fae5; }

.reset-designer-btn { 
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  transition: 0.2s;
  color: #ef4444; 
  background: #fef2f2; 
  border: 1px solid #fee2e2; 
  cursor: pointer;
}
.reset-designer-btn:hover { background: #fee2e2; }

.is-collapsed .xl-btn-base, .is-collapsed .reset-designer-btn { justify-content: center; padding: 0; }
.is-collapsed .ml-3, .is-collapsed .ml-2 { display: none; }

.xl-clear:hover { color: #ef4444; }
</style>
