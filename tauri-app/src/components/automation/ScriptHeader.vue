<script setup lang="ts">
import { Circle, Square, Terminal, Zap, Save, Settings2 } from 'lucide-vue-next';

defineProps<{
  activeTab: string, workflowName: string, isRecording: boolean,
  showConsole: boolean, isProcessing: boolean, rightSidebarCollapsed: boolean
}>();

const emit = defineEmits([
  'update:activeTab', 'update:workflowName', 'toggle-recording', 
  'toggle-console', 'run', 'save', 'refresh-saved', 'toggle-right-sidebar'
]);
</script>

<template>
  <header class="toolbar">
    <div class="tab-switcher">
      <button :class="{ active: activeTab === 'editor' }" @click="emit('update:activeTab', 'editor')">Designer</button>
      <button :class="{ active: activeTab === 'preview' }" @click="emit('update:activeTab', 'preview')">Editor</button>
      <button :class="{ active: activeTab === 'saved' }" @click="emit('update:activeTab', 'saved'); emit('refresh-saved')">Saved</button>
    </div>
    
    <div class="controls-row">
      <input :value="workflowName" @input="emit('update:workflowName', ($event.target as HTMLInputElement).value)" class="task-name-input" placeholder="Task Name" />
      
      <div class="button-group">
        <button @click="emit('save')" class="action-btn save-btn" title="Save Script"><Save size="14"/> <span>Save</span></button>
        <button @click="emit('toggle-recording')" class="action-btn record-btn" :class="{ 'recording-active': isRecording }">
          <component :is="isRecording ? Square : Circle" size="14" :fill="isRecording ? 'white' : 'currentColor'"/>
          <span>{{ isRecording ? 'Stop' : 'Record' }}</span>
        </button>
        <button @click="emit('run')" class="action-btn test-btn" title="Run Task"><Zap size="14"/> <span>Run</span></button>
        <div class="divider"></div>
        <button @click="emit('toggle-console')" class="tool-icon-btn" :class="{ active: showConsole }" title="Toggle Console"><Terminal size="18"/></button>        
        <button @click="emit('toggle-right-sidebar')" class="tool-icon-btn" :class="{ active: !rightSidebarCollapsed }" title="Properties"><Settings2 size="18"/></button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.toolbar { height: 64px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: 0 1.25rem; flex-shrink: 0; }
.tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 2px; }
.tab-switcher button { border: none; padding: 6px 12px; border-radius: 7px; font-size: 0.75rem; font-weight: 700; cursor: pointer; color: #64748b; }
.tab-switcher button.active { background: white; color: #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.controls-row { display: flex; align-items: center; gap: 12px; }
.button-group { display: flex; align-items: center; gap: 6px; }
.task-name-input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 0.8rem; width: 140px; height: 34px; outline: none; }
.divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }
.action-btn { border: none; height: 34px; width: 85px; padding: 0 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; color: white; }
.save-btn { background: #6366f1; }
.test-btn { background: #f59e0b; }
.record-btn { background: #ef4444; }
.recording-active { background: #1e293b; animation: pulse-red 2s infinite; }
@keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 100% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } }
.tool-icon-btn { 
  background: transparent; /* Start transparent like sidebar items */
  border: 1px solid transparent; 
  border-radius: 8px; 
  width: 36px; 
  height: 36px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  color: #64748b; /* Standard grey */
  transition: all 0.2s ease; /* Smooth transition like sidebar */
}

/* Hover state: Matches Sidebar action-item:hover */
.tool-icon-btn:hover { 
  background: #f1f5f9; 
  color: #6366f1; /* Indigo color */
}

/* Active state: Keep it distinct so user knows tool is "ON" */
.tool-icon-btn.active { 
  background: #f1f5f9; /* Stay grey */
  color: #6366f1;      /* Stay Indigo */
  border-color: rgba(99, 102, 241, 0.2); /* Subtle indigo border */
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); /* Slight "pressed" look */
}

/* Special case: when active AND hovered, make it slightly more vibrant */
.tool-icon-btn.active:hover {
  background: #eef2ff; /* Very light indigo */
  color: #4f46e5;      /* Darker indigo */
}
</style>
