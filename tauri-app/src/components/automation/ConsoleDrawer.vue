<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, Eraser, Square, ChevronUp, Search, X } from 'lucide-vue-next';
import { Task } from '../../types/automation';

const props = defineProps<{ tasks: Task[], isProcessing: boolean }>();
const emit = defineEmits(['close', 'clear', 'stop']);

// 1. Search State
const searchQuery = ref("");

// 2. Filter Logic (Matches ID or Label)
const filteredTasks = computed(() => {
  if (!searchQuery.value) return props.tasks;
  const q = searchQuery.value.toLowerCase();
  return props.tasks.filter(t => 
    t.label.toLowerCase().includes(q) || 
    t.id.toLowerCase().includes(q)
  );
});

function scroll(direction: 'top' | 'bottom') {
  const el = document.getElementById('console-body');
  if (!el) return;
  el.scrollTo({
    top: direction === 'top' ? 0 : el.scrollHeight,
    behavior: 'smooth'
  });
}
</script>

<template>
  <div class="console-drawer">
    <!-- HEADER (Cleaner) -->
    <div class="console-header">
      <div class="console-header-left">
        <span class="console-title">AUTOMATION LOGS</span>
        
        <div class="console-search">
          <Search size="12" class="search-icon" />
          <input v-model="searchQuery" placeholder="Find in logs..." class="search-input" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search"><X size="10" /></button>
        </div>
      </div>

      <div class="console-header-right">
        <button v-if="isProcessing" @click="emit('stop')" class="terminate-btn-console" title="Terminate the automation tasks">
          <Square size="12" fill="currentColor"/><span class="ml-1">Terminate</span>
        </button>
        <button @click="emit('clear')" class="console-tool-btn" title="Clear Logs"><Eraser size="14"/></button>
        <button @click="emit('close')" class="console-tool-btn" title="Close the console tool"><ChevronDown size="16"/></button>
      </div>
    </div>

    <!-- LOG BODY (With Floating Controls) -->
    <div class="console-body-wrapper">
      <div id="console-body" class="console-body">
        <div v-for="task in filteredTasks" :key="task.id" class="task-row">
          <div class="status-icon">
            <span v-if="task.status === 'running'" class="spinner"></span>
            <span v-else-if="task.status === 'success'" class="check">✔</span>
            <span v-else-if="task.status === 'error'" class="cross">✘</span>
          </div>
          <div class="task-label" :class="{ 'text-dim': task.status === 'success' }">
            <span v-if="task.id !== 'EXECUTION' && !task.id.startsWith('sys-')" class="action-id">{{ task.id }}:</span> 
            {{ task.label }}
          </div>
        </div>

        <div v-if="searchQuery && filteredTasks.length === 0" class="search-empty">
          No logs match "{{ searchQuery }}"
        </div>
      </div>

      <!-- FLOATING SCROLL ACTIONS -->
      <div class="floating-scroll-actions">
        <button @click="scroll('top')" class="scroll-fab" title="Jump to Top">
          <ChevronUp size="14"/>
        </button>
        <button @click="scroll('bottom')" class="scroll-fab" title="Jump to Bottom">
          <ChevronDown size="14"/>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container to hold the log area and the floating buttons */
.console-body-wrapper {
  flex: 1;
  position: relative; /* Context for the floating buttons */
  overflow: hidden;
  display: flex;
}

.console-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  scroll-behavior: smooth;
  font-family: 'JetBrains Mono', monospace;
}

/* FLOATING BUTTON GROUP */
.floating-scroll-actions {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(30, 41, 59, 0.7); /* slate-800 with transparency */
  backdrop-filter: blur(4px);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(51, 65, 85, 0.8); /* slate-700 */
  opacity: 0.4;
  transition: opacity 0.2s;
  z-index: 10;
}

.floating-scroll-actions:hover {
  opacity: 1;
}

.scroll-fab, .console-tool-btn, .clear-search {
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

.scroll-fab:hover, .console-tool-btn:hover, .clear-search:hover {
  background: #6366f1; /* Indigo-500 */
  color: white;
}

/* Rest of your existing styles... */
.console-drawer { height: 260px; background: #0f172a; border-top: 2px solid #334155; display: flex; flex-direction: column; flex-shrink: 0; }
.console-header { padding: 8px 16px; background: #0f172a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; }
.console-header-left { display: flex; align-items: center; }
.console-header-right { display: flex; align-items: center; gap: 8px; }
.console-title { font-size: 0.7rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
.console-search { display: flex; align-items: center; gap: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 2px 10px; width: 200px; margin-left: 12px; }
.search-input { background: transparent; border: none; outline: none; color: #cbd5e1; font-size: 0.75rem; width: 100%; }
.terminate-btn-console { color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; display: flex; align-items: center; border: none; cursor: pointer; }
.task-row { display: flex; gap: 12px; margin-bottom: 6px; align-items: flex-start; }
.status-icon { width: 20px; flex-shrink: 0; display: flex; justify-content: center; padding-top: 2px; }
.task-label { color: #e2e8f0; font-size: 0.85rem; }
.text-dim { color: #64748b; }
.action-id { color: #818cf8; font-weight: bold; font-size: 0.7rem; background: rgba(99, 102, 241, 0.15); padding: 1px 5px; border-radius: 4px; margin-right: 4px; }
.check { color: #10b981; }
.cross { color: #ef4444; }
.spinner::after { content: "⠋"; color: #6366f1; animation: rotate 1s linear infinite; }
@keyframes rotate { 0% { content: "⠋"; } 12% { content: "⠙"; } 25% { content: "⠹"; } 37% { content: "⠸"; } 50% { content: "⠼"; } 62% { content: "⠴"; } 75% { content: "⠦"; } 87% { content: "⠧"; } 100% { content: "⠋"; } }
</style>
