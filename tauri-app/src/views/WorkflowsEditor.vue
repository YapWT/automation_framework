<script setup lang="ts">
import { onMounted, watch, toRefs, computed, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAutomation } from '../composables/useAutomation';

// Component Imports
import SidebarActions from '../components/automation/SidebarActions.vue';
import ScriptHeader from '../components/automation/ScriptHeader.vue';
import ConsoleDrawer from '../components/automation/ConsoleDrawer.vue';
import StepDesigner from '../components/automation/StepDesigner.vue';
import PropertyEditor from '../components/automation/PropertyEditor.vue';
import ScriptEditor from '../components/automation/ScriptEditor.vue';
import SavedScriptsList from '../components/automation/SavedScriptsList.vue';

const auth = useAutomation();

const { 
  activeTab, workflow, isRecording, showConsole, isProcessing, 
  tasks, finalCode, isManualEdit, savedScripts, selectedStepIndex, 
  activeStep, leftSidebarCollapsed, rightSidebarCollapsed, clipboardStep
} = toRefs(auth);

// --- STATE ---
const leftWidth = ref(240);
const rightWidth = ref(300);
const consoleHeight = ref(240);
const isFullscreenConsole = ref(false);

// --- RESIZING LOGIC WITH SNAP-TO-COLLAPSE ---
const startResizing = (direction: 'left' | 'right' | 'vertical', event: MouseEvent) => {
  event.preventDefault();
  const startPos = direction === 'vertical' ? event.clientY : event.clientX;
  const startSize = direction === 'vertical' ? consoleHeight.value : (direction === 'left' ? leftWidth.value : rightWidth.value);

  const onMouseMove = (e: MouseEvent) => {
    const delta = direction === 'vertical' 
      ? startPos - e.clientY 
      : (direction === 'left' ? e.clientX - startPos : startPos - e.clientX);

    if (direction === 'vertical') {
      const newHeight = startSize + delta;
      // Snap-to-collapse: if dragged below 60px, hide console
      if (newHeight < 60) { showConsole.value = false; } 
      else { 
        showConsole.value = true;
        consoleHeight.value = Math.max(100, Math.min(window.innerHeight * 0.85, newHeight)); 
      }
    } else if (direction === 'left') {
      const newWidth = startSize + delta;
      // Snap-to-collapse: if dragged below 100px, collapse left sidebar
      if (newWidth < 100) { leftSidebarCollapsed.value = true; } 
      else { 
        leftSidebarCollapsed.value = false;
        leftWidth.value = Math.max(160, Math.min(500, newWidth)); 
      }
    } else if (direction === 'right') {
      const newWidth = startSize + delta;
      // Snap-to-collapse: if dragged below 100px, hide right sidebar
      if (newWidth < 100) { rightSidebarCollapsed.value = true; } 
      else { 
        rightSidebarCollapsed.value = false;
        rightWidth.value = Math.max(200, Math.min(500, newWidth)); 
      }
    }
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'default';
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = direction === 'vertical' ? 'ns-resize' : 'col-resize';
};

const dynamicGrid = computed(() => {
  const left = leftSidebarCollapsed.value ? '64px' : `${leftWidth.value}px`;
  const right = rightSidebarCollapsed.value ? '0px' : `${rightWidth.value}px`;
  return `${left} 2px 1fr 2px ${right}`;
});

onMounted(async () => {
  await auth.refreshSaved();
  await listen('automation-log', (e) => auth.handleIncomingLog(e.payload as string));
  await listen('automation-finished', () => {
    auth.handleIncomingLog(`TASK:DONE:EXECUTION`);
    auth.isProcessing.value = false;
  });
});

watch(finalCode, async (val) => { await invoke('auto_save_temp', { code: val }); });
</script>

<template>
  <div class="editor-layout" :style="{ gridTemplateColumns: dynamicGrid }">
    
    <SidebarActions 
      :workflow="workflow"
      :collapsed="leftSidebarCollapsed"
      @add-step="auth.addStep" 
      @select-excel="auth.selectExcel"
      @reset-designer="auth.resetDesigner"
      @toggle="leftSidebarCollapsed = !leftSidebarCollapsed"
    />

    <div v-if="!leftSidebarCollapsed" class="resizer-h" @mousedown="startResizing('left', $event)"></div>
    <div v-else class="resizer-dummy"></div>

    <main class="main-canvas">
      <ScriptHeader 
        v-model:activeTab="activeTab" 
        v-model:workflowName="workflow.name"
        :isRecording="isRecording"
        :showConsole="showConsole"
        :isProcessing="isProcessing"
        :rightSidebarCollapsed="rightSidebarCollapsed"
        @toggle-recording="auth.toggleRecording"
        @toggle-console="showConsole = !showConsole"
        @toggle-right-sidebar="rightSidebarCollapsed = !rightSidebarCollapsed"
        @run="auth.handleRun(true)"
        @save="auth.handleSave"
        @refresh-saved="auth.refreshSaved"
      />

      <div class="workspace-area">
        <section v-if="activeTab === 'editor'" class="canvas-content">
           <StepDesigner :workflow="workflow" v-model:selectedIndex="selectedStepIndex" :clipboardStep="clipboardStep" @copy="auth.handleCopy" @paste="auth.handlePaste" />
        </section>
        <ScriptEditor v-else-if="activeTab === 'preview'" v-model="finalCode" :isManualEdit="isManualEdit" @reset="isManualEdit = false" />
        <SavedScriptsList v-else-if="activeTab === 'saved'" :savedScripts="savedScripts" @load="auth.loadScript" @run="auth.handleRunManual" @delete="auth.handleDelete" />
      </div>

      <ConsoleDrawer 
        v-if="showConsole" 
        :style="{ height: isFullscreenConsole ? '100%' : consoleHeight + 'px' }" 
        :tasks="tasks" 
        :isProcessing="isProcessing"
        :isFullscreen="isFullscreenConsole"
        @resize-start="startResizing('vertical', $event)"
        @toggle-fullscreen="isFullscreenConsole = !isFullscreenConsole"
        @close="showConsole = false"
        @clear="tasks = []"
        @stop="auth.stopAutomation"
      />
    </main>

    <div v-if="!rightSidebarCollapsed" class="resizer-h" @mousedown="startResizing('right', $event)"></div>
    <div v-else class="resizer-dummy"></div>

    <PropertyEditor
      v-if="!rightSidebarCollapsed"
      :activeStep="activeStep" 
      :workflow="workflow"
      @close="rightSidebarCollapsed = true"
      @resize-start="startResizing('right', $event)"
    />
  </div>
</template>

<style scoped>
.editor-layout { display: grid; height: 100vh; width: 100vw; overflow: hidden; background: #f1f5f9; }
* {
  box-sizing: border-box;
}
.resizer-h { width: 4px; cursor: col-resize; background: #e2e8f0; z-index: 50; position: relative; }
.resizer-h:hover { background: #6366f1; }
.resizer-dummy { width: 1px; background: #e2e8f0; }
.main-canvas { display: flex; flex-direction: column; height: 100%; min-width: 0; overflow: hidden; position: relative; }
.workspace-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; min-height: 0; }
.canvas-content { flex: 1; padding: 2rem; overflow-y: auto; background: #f8fafc; }
</style>
