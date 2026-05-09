<script setup lang="ts">
import { Circle, Square, Terminal, Zap, Save } from 'lucide-vue-next';

const props = defineProps<{
  activeTab: string,
  workflowName: string,
  isRecording: boolean,
  showConsole: boolean,
  isProcessing: boolean
}>();

// Define exactly what this component can tell the parent
const emit = defineEmits([
  'update:activeTab', 
  'update:workflowName', 
  'toggle-recording', 
  'toggle-console', 
  'run', 
  'save', 
  'refresh-saved'
]);
</script>

<template>
  <header class="toolbar">
    <div class="tab-switcher">
      <!-- FIXED: Use update:activeTab -->
      <button 
        :class="{ active: activeTab === 'editor' }" 
        @click="emit('update:activeTab', 'editor')"
      >Designer</button>
      
      <button 
        :class="{ active: activeTab === 'preview' }" 
        @click="emit('update:activeTab', 'preview')"
      >Script Editor</button>
      
      <button 
        :class="{ active: activeTab === 'saved' }" 
        @click="emit('update:activeTab', 'saved'); emit('refresh-saved')"
      >Saved</button>
    </div>
    
    <div class="controls-row">
      <input 
        :value="workflowName" 
        @input="emit('update:workflowName', ($event.target as HTMLInputElement).value)"
        class="task-name-input" 
        placeholder="Task Name" 
      />
      
      <div class="button-group">
        <button @click="emit('save')" class="action-btn save-btn">
          <Save size="14"/> Save Script
        </button>

        <button @click="emit('toggle-recording')" class="action-btn record-btn" :class="{ 'recording-active': isRecording }">
          <component :is="isRecording ? Square : Circle" size="14" :fill="isRecording ? 'white' : 'currentColor'"/>
          {{ isRecording ? 'Stop Recording' : 'Record Actions' }}
        </button>

        <button @click="emit('run')" class="action-btn test-btn">
          <Zap size="14"/> Test Run
        </button>

        <button @click="emit('toggle-console')" class="tool-icon-btn" :class="{ active: showConsole }">
          <Terminal size="18"/>
        </button>        
      </div>
    </div>
  </header>
</template>

<style scoped>
.toolbar { height: 64px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: 0 1.25rem; flex-shrink: 0; }
.tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 2px; }
.tab-switcher button { border: none; padding: 6px 14px; border-radius: 7px; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #64748b; }
.tab-switcher button.active { background: white; color: #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.controls-row { display: flex; align-items: center; gap: 12px; height: 40px; }
.button-group { display: flex; align-items: center; gap: 8px; }
.task-name-input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 0.85rem; width: 140px; height: 36px; outline: none; }
.action-btn { border: none; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; color: white; }
.test-btn { background: #f59e0b; }
.save-btn { background: #6366f1; }
.record-btn { background: #ef4444; transition: 0.3s; }
.recording-active { background: #1e293b; animation: pulse-red 2s infinite; }
@keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 100% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } }
.tool-icon-btn { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
.tool-icon-btn.active { background: #334155; color: white; }
</style>
