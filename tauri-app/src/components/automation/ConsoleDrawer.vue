<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, Eraser, Square, ChevronUp, Search, X, Maximize2, Minimize2 } from 'lucide-vue-next';
import { Task } from '../../types/automation';

const props = defineProps<{ tasks: Task[], isProcessing: boolean, isFullscreen: boolean }>();
const emit = defineEmits(['close', 'clear', 'stop', 'resize-start', 'toggle-fullscreen']);

const searchQuery = ref("");
const filteredTasks = computed(() => {
  if (!searchQuery.value) return props.tasks;
  const q = searchQuery.value.toLowerCase();
  return props.tasks.filter(t => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
});

const scroll = (direction: 'top' | 'bottom') => {
  const el = document.getElementById('console-body');
  if (el) el.scrollTo({ top: direction === 'top' ? 0 : el.scrollHeight, behavior: 'smooth' });
};
</script>

<template>
  <div class="console-drawer" :class="{ 'is-fullscreen': isFullscreen }">
    <div v-if="!isFullscreen" class="resize-handle-v" @mousedown="emit('resize-start', $event)"></div>

    <div class="console-header">
      <div class="console-header-left overflow-hidden">
        <span class="console-title shrink-0">LOGS</span>
        <div class="console-search">
          <Search :size="12" class="search-icon" />
          <input v-model="searchQuery" placeholder="Filter..." class="search-input" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn"><X :size="10" /></button>
        </div>
      </div>

      <div class="console-header-right">
        <button v-if="isProcessing" @click="emit('stop')" class="terminate-btn" title="Terminate">
          <Square :size="12" fill="currentColor"/><span>Terminate</span>
        </button>
        <button @click="emit('toggle-fullscreen')" class="tool-btn" :title="isFullscreen ? 'Restore' : 'Fullscreen'">
          <component :is="isFullscreen ? Minimize2 : Maximize2" :size="14"/>
        </button>
        <button @click="emit('clear')" class="tool-btn" title="Clear"><Eraser :size="14"/></button>
        <button @click="emit('close')" class="tool-btn" title="Collapse"><ChevronDown :size="16"/></button>
      </div>
    </div>

    <div class="console-body-wrapper">
      <div id="console-body" class="console-body">
        <div v-for="task in filteredTasks" :key="task.id" class="task-row">
          <div class="status-icon">
            <span v-if="task.status === 'running'" class="spinner"></span>
            <span v-else :class="['check-cross', task.status === 'success' ? 'check' : 'cross']">{{ task.status === 'success' ? '✔' : '✘' }}</span>
          </div>
          <div class="task-label" :class="{ 'text-dim': task.status === 'success' }">
            <span v-if="task.id !== 'EXECUTION' && !task.id.startsWith('sys-')" class="action-id">{{ task.id }}:</span> {{ task.label }}
          </div>
        </div>
        <div v-if="searchQuery && filteredTasks.length === 0" class="search-empty">
          No logs match "{{ searchQuery }}"
        </div>
      </div>
      <div class="floating-scroll-actions">
        <button @click="scroll('top')" class="scroll-fab" title="To Top"><ChevronUp :size="14"/></button>
        <button @click="scroll('bottom')" class="scroll-fab rotate-180" title="To Bottom"><ChevronUp :size="14"/></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-empty { color: #cbd5e1; padding: 10px; text-align: center; font-style: italic; }

.console-drawer { 
  background: #0f172a; 
  border-top: 1px solid #334155; 
  display: flex; 
  flex-direction: column; 
  flex-shrink: 0; 
  position: relative; 
  /* REMOVED: transition: height 0.2s ease; <--- THIS WAS THE LAG CAUSE */
}

/* Apply transition ONLY when entering/exiting fullscreen, not during drag */
.console-drawer.is-fullscreen { 
  position: absolute; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  height: 100% !important; 
  z-index: 100; 
  border-top: none; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}

.resize-handle-v { 
  position: absolute; 
  top: -4px; /* Increased hit area slightly */
  left: 0; 
  right: 0; 
  height: 8px; 
  cursor: ns-resize; 
  z-index: 50; 
  background: transparent;
}

.resize-handle-v:hover { 
  background: rgba(99, 102, 241, 0.4); /* Visual feedback on hover */
}

/* Rest of your styles remain unchanged... */
.console-header { padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; min-height: 40px; background: #0f172a; }
.console-header-left, .console-header-right { display: flex; align-items: center; gap: 8px; }
.console-title { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
.console-search { display: flex; align-items: center; gap: 6px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; width: 150px; }
.search-input { background: transparent; border: none; outline: none; color: #cbd5e1; font-size: 0.7rem; width: 100%; }
.terminate-btn { color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
.terminate-btn:hover { background: #ef4444; color: white; }
.tool-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 4px; transition: 0.2s; }
.tool-btn:hover { background: #1e293b; color: white; }
.clear-btn { background: none; border: none; color: #64748b; cursor: pointer; display: flex; padding: 2px; }
.clear-btn:hover { color: #94a3b8; }
.console-body-wrapper { flex: 1; position: relative; overflow: hidden; display: flex; }
.console-body { flex: 1; padding: 12px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; scroll-behavior: smooth; }
.task-row { display: flex; gap: 10px; margin-bottom: 4px; align-items: flex-start; }
.status-icon { width: 18px; flex-shrink: 0; display: flex; justify-content: center; padding-top: 2px; }
.action-id { color: #818cf8; font-weight: bold; font-size: 0.7rem; background: rgba(99, 102, 241, 0.15); padding: 0 4px; border-radius: 3px; }
.floating-scroll-actions { position: absolute; right: 20px; bottom: 20px; display: flex; flex-direction: column; gap: 4px; opacity: 0.3; transition: opacity 0.3s; z-index: 10; }
.floating-scroll-actions:hover { opacity: 1; }
.scroll-fab { width: 28px; height: 28px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.scroll-fab:hover { background: #6366f1; color: white; }
.rotate-180 { transform: rotate(180deg); }
.check { color: #10b981; } .cross { color: #ef4444; } .text-dim { color: #64748b; }
.spinner::after { content: "⠋"; color: #6366f1; animation: rotate 1s linear infinite; }
@keyframes rotate { 0% { content: "⠋"; } 12.5% { content: "⠙"; } 25% { content: "⠹"; } 37.5% { content: "⠸"; } 50% { content: "⠼"; } 62.5% { content: "⠴"; } 75% { content: "⠦"; } 87.5% { content: "⠧"; } 100% { content: "⠋"; } }
</style>
