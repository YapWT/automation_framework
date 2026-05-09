<script setup lang="ts">
import draggable from 'vuedraggable';
import { GripVertical, Copy, Trash2, Settings2, Clipboard } from 'lucide-vue-next';

const props = defineProps<{ 
  workflow: any,
  selectedIndex: number | null,
  clipboardStep: any // Added prop to check if we can paste
}>();

const emit = defineEmits(['update:selectedIndex', 'copy', 'paste']);

function select(index: number) {
  emit('update:selectedIndex', index);
}

function remove(index: number) {
  props.workflow.steps.splice(index, 1);
  emit('update:selectedIndex', null);
}
</script>

<template>
  <div class="designer-container">
    <!-- Empty State -->
    <div v-if="workflow.steps.length === 0" class="empty-state">
       <Settings2 size="48" class="mb-4 opacity-10" />
       <p>Choose an interaction on the left to start building.</p>
    </div>
    
    <!-- Step List -->
    <draggable 
      v-model="workflow.steps" 
      item-key="id" 
      handle=".handle" 
      class="drag-list"
      @start="emit('update:selectedIndex', null)"
    >
      <template #item="{ element, index }">
        <div 
          class="step-card" 
          :class="{ active: selectedIndex === index }" 
          @click="select(index)"
        >
          <div class="handle"><GripVertical size="16"/></div>
          <div class="step-badge">{{ index + 1 }}</div>
          
          <div class="step-info">
            <span class="step-type">{{ element.action.toUpperCase() }}</span>
            <span class="step-desc">{{ element.params.selector || element.params.url || element.params.key || '...' }}</span>
          </div>

          <div class="step-tools">
            <!-- COPY BUTTON -->
            <button class="step-tool-btn" @click.stop="emit('copy', element)">
              <Copy size="14"/>
            </button>
            <!-- DELETE BUTTON -->
            <button class="step-tool-btn del" @click.stop="remove(index)">
              <Trash2 size="14"/>
            </button>
          </div>
        </div>
      </template>
    </draggable>

    <!-- PASTE BUTTON (Only shows if something is copied) -->
    <button v-if="clipboardStep" class="paste-fab" @click="emit('paste')">
      <Clipboard size="14"/> Paste Step
    </button>
  </div>
</template>

<style scoped>
.designer-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drag-list { width: 100%; max-width: 650px; }

.step-card { 
  background: white; 
  padding: 1.25rem; 
  border-radius: 12px; 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  margin-bottom: 0.75rem; 
  border: 1px solid #e2e8f0; 
  cursor: pointer; 
  transition: 0.2s; 
}

.step-card.active { border-color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08); }

.step-badge { 
  width: 26px; 
  height: 26px; 
  background: #f1f5f9; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 0.75rem; 
  font-weight: 800; 
  color: #6366f1; 
}

.step-info { flex: 1; overflow: hidden; }
.step-type { font-weight: 800; font-size: 0.7rem; color: #94a3b8; display: block; text-transform: uppercase; }
.step-desc { font-size: 0.85rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.step-tools { display: flex; gap: 4px; opacity: 0; transition: 0.2s; }
.step-card:hover .step-tools { opacity: 1; }

.step-tool-btn { background: none; border: none; padding: 6px; cursor: pointer; color: #94a3b8; }
.step-tool-btn:hover { color: #6366f1; }
.step-tool-btn.del:hover { color: #ef4444; }

.handle { cursor: grab; color: #cbd5e1; }

.paste-fab { 
  margin-top: 1.5rem; 
  background: #f5f3ff; 
  color: #7c3aed; 
  border: 1px dashed #7c3aed; 
  padding: 10px 24px; 
  border-radius: 12px; 
  cursor: pointer; 
  font-size: 0.8rem; 
  font-weight: 700; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}

.empty-state { padding: 4rem; text-align: center; color: #94a3b8; }
</style>
