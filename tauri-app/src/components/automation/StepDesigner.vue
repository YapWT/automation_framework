<script setup lang="ts">
import draggable from 'vuedraggable';
import { GripVertical, Copy, Trash2, Settings2, Clipboard, X, Plus } from 'lucide-vue-next';

const props = defineProps<{
  workflow: any,
  selectedIndex: number | null,
  clipboardStep: any,
  copiedSourceId: number | null,
  isMoveMode: boolean
}>();

const emit = defineEmits(['update:selectedIndex', 'copy', 'paste', 'cancel-copy']);

function select(index: number) {
  emit('update:selectedIndex', index);
}

function remove(index: number) {
  // 1. Perform the removal
  props.workflow.steps.splice(index, 1);

  // 2. Handle new selection logic
  if (props.workflow.steps.length === 0) {
    emit('update:selectedIndex', null);
  } else {
    // Goal: Select the step before the one just deleted.
    // If the first step (0) was deleted, index - 1 is -1, so we select the new index 0.
    const nextSelection = Math.max(0, index - 1);
    emit('update:selectedIndex', nextSelection);
  }
}
</script>

<template>
  <div class="designer-container">
    <!-- Empty State -->
    <div v-if="workflow.steps.length === 0" class="empty-state">
      <Settings2 :size="48" class="mb-4 opacity-10" />
      <p>Choose an interaction on the left to start building.</p>
      <button v-if="clipboardStep" class="paste-fab mt-4" @click="emit('paste', 0)">
        <Clipboard :size="14" /> Paste first step
      </button>
    </div>

    <div class="drag-list-wrapper">
      <!-- TOP PASTE ZONE -->
      <div v-if="clipboardStep && workflow.steps.length > 0" class="inline-paste-btn" @click="emit('paste', 0)">
        <Plus :size="12" /> Insert Step Here
      </div>

      <draggable v-model="workflow.steps" item-key="id" handle=".handle" class="drag-list"
        @start="emit('update:selectedIndex', null)">
        <template #item="{ element, index }">
          <div class="step-wrapper">
            <div class="step-card" :class="{
              active: selectedIndex === index,
              'is-copied': clipboardStep && element.id === copiedSourceId,
              'is-moving': isMoveMode && selectedIndex === index
            }" @click="select(index)">
              <div class="handle" title="Move Step (Ctrl + M)">
                <GripVertical :size="16" />
              </div>
              <div class="step-badge">{{ index + 1 }}</div>

              <div class="step-info">
                <span class="step-type">{{ element.action.toUpperCase() }}</span>
                <span class="step-desc">{{ element.params.selector || element.params.url || element.params.key || '...'
                }}</span>
              </div>

              <div class="step-tools">
                <button class="step-tool-btn" @click.stop="emit('copy', element)" title="Copy Step (Ctrl + C)">
                  <Copy :size="14" />
                </button>
                <button class="step-tool-btn del" @click.stop="remove(index)" title="Delete Step (Backspace / Del)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- IN-BETWEEN PASTE ZONE -->
            <div v-if="clipboardStep" class="inline-paste-btn" @click="emit('paste', index + 1)">
              <Plus :size="12" /> Insert Step Here
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- BOTTOM FLOATING CONTROLS -->
    <div v-if="clipboardStep" class="paste-controls">
      <button class="paste-fab" @click="emit('paste')">
        <Clipboard :size="14" /> Paste at Bottom
      </button>
      <button class="cancel-fab" @click="emit('cancel-copy')" title="Cancel Copy (Esc)">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.designer-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.drag-list-wrapper {
  width: 100%;
  max-width: 650px;
  padding: 20px 0;
}

.drag-list {
  width: 100%;
}

.step-wrapper {
  width: 100%;
}

.inline-paste-btn {
  height: 8px;
  margin: 4px 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: #6366f1;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  background: transparent;
  border: 1px dashed transparent;
}

.inline-paste-btn:hover {
  height: 32px;
  opacity: 1;
  background: #f5f3ff;
  border-color: #c4b5fd;
  margin: 8px 0;
}

.step-card {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: 0.2s;
  position: relative;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

/* ACTIVE STATE */
.step-card.active {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
  z-index: 2;
}

/* COPIED STATE */
.step-card.is-copied {
  border: 1px dashed #6366f1;
  background: #f8faff;
}

.step-card.is-copied::after {
  content: "COPIED";
  position: absolute;
  top: -8px;
  right: 12px;
  background: #6366f1;
  color: white;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
}

/* MOVE MODE UI */
.step-card.is-moving {
  border: 1px dashed #f59e0b;
  background: #fffbeb;
}

.step-card.is-moving::after {
  content: "MOVING";
  position: absolute;
  top: -8px;
  right: 12px;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
}

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

.step-info {
  flex: 1;
  overflow: hidden;
}

.step-type {
  font-weight: 800;
  font-size: 0.7rem;
  color: #94a3b8;
  display: block;
  text-transform: uppercase;
}

.step-desc {
  font-size: 0.85rem;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-tools {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: 0.2s;
}

.step-card:hover .step-tools {
  opacity: 1;
}

.step-tool-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #94a3b8;
}

.step-tool-btn:hover {
  color: #6366f1;
}

.step-tool-btn.del:hover {
  color: #ef4444;
}

.handle {
  cursor: grab;
  color: #cbd5e1;
}

.paste-controls {
  position: sticky;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  margin-top: 1.5rem;
}

.paste-fab {
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
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
}

.cancel-fab {
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}

.cancel-fab:hover {
  background: #ef4444;
  color: white;
}

.empty-state {
  padding: 4rem;
  text-align: center;
  color: #94a3b8;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
