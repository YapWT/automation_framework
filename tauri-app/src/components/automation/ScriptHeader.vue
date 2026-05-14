<script setup lang="ts">
import { Terminal, Zap, Save, Settings2 } from 'lucide-vue-next';
import ThemeToggle from './ThemeToggle.vue';
import '../../assets/dark-theme.css';

defineProps<{
  activeTab: string, workflowName: string, showConsole: boolean, isProcessing: boolean, rightSidebarCollapsed: boolean
}>();
const emit = defineEmits([
  'update:activeTab', 'update:workflowName',
  'toggle-console', 'run', 'save', 'refresh-saved', 'toggle-right-sidebar'
]);
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <div class="tab-switcher">
        <button :class="{ active: activeTab === 'editor' }"
          @click="emit('update:activeTab', 'editor')">Designer</button>
        <button :class="{ active: activeTab === 'preview' }"
          @click="emit('update:activeTab', 'preview')">Editor</button>
        <button :class="{ active: activeTab === 'saved' }"
          @click="emit('update:activeTab', 'saved'); emit('refresh-saved')">Saved</button>
      </div>
    </div>

    <div class="toolbar-right">
      <div class="button-group">
        <button @click="emit('save')" class="action-btn save-btn" title="Save">
          <Save :size="14" /> <span class="hide-md">Save</span>
        </button>
        <button @click="emit('run')" class="action-btn test-btn" title="Run">
          <Zap :size="14" /> <span class="hide-md">Run</span>
        </button>
        <div class="divider"></div>
        <button @click="emit('toggle-console')" class="tool-icon-btn" :class="{ active: showConsole }" title="Console">
          <Terminal :size="18" />
        </button>
        <button @click="emit('toggle-right-sidebar')" class="tool-icon-btn" :class="{ active: !rightSidebarCollapsed }"
          title="Properties">
          <Settings2 :size="18" />
        </button>
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<style scoped>
.active-filename {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 6px;
  margin-left: 8px;
}

.toolbar {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  flex-shrink: 0;
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.tab-switcher {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  flex-shrink: 0;
}

.tab-switcher button {
  border: none;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  color: #64748b;
  white-space: nowrap;
}

.tab-switcher button.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.button-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.task-name-input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 0.8rem;
  width: 120px;
  height: 34px;
  outline: none;
}

.divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}

.action-btn {
  border: none;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: white;
  white-space: nowrap;
}

.save-btn {
  background: #6366f1;
}

.test-btn {
  background: #f59e0b;
}

.tool-icon-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: 0.2s;
}

.tool-icon-btn:hover,
.tool-icon-btn.active {
  background: #f1f5f9;
  color: #6366f1;
}

.tool-icon-btn.active {
  border-color: rgba(99, 102, 241, 0.2);
}

@media (max-width: 1000px) {
  .hide-md {
    display: none;
  }

  .action-btn {
    padding: 0 10px;
  }
}

@media (max-width: 700px) {
  .hide-sm {
    display: none;
  }

  .toolbar {
    height: auto;
    padding: 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: space-between;
  }
}
</style>
