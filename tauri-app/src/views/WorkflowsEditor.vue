<script setup lang="ts">
import { onMounted, watch, toRefs, computed } from 'vue'; // Added computed
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

// toRefs keeps the reactivity connection to the useAutomation instance
const { 
  activeTab, 
  workflow, 
  isRecording, 
  showConsole, 
  isProcessing, 
  tasks, 
  finalCode, 
  isManualEdit, 
  savedScripts,
  selectedStepIndex,
  activeStep,
  leftSidebarCollapsed,
  rightSidebarCollapsed,
  clipboardStep
} = toRefs(auth);

onMounted(async () => {
  await auth.refreshSaved();
  
  // LOG LISTENER
  await listen('automation-log', (e) => {
    auth.handleIncomingLog(e.payload as string);
  });
  
  // FINISH LISTENER
  await listen('automation-finished', (e) => {
    auth.handleIncomingLog(`TASK:DONE:EXECUTION`);
    auth.isProcessing.value = false;
  });
});

// Sync changes to temp file for Test Run
watch(finalCode, async (val) => {
  await invoke('auto_save_temp', { code: val });
});

// Dynamic Resizing Logic for Grid
const leftWidth = computed(() => leftSidebarCollapsed.value ? '64px' : '240px');
const rightWidth = computed(() => rightSidebarCollapsed.value ? '0px' : '300px');

// Grid definition: Left Sidebar | Main Content | Right Sidebar
const gridLayout = computed(() => `${leftWidth.value} 1fr ${rightWidth.value}`);

</script>

<template>
  <!-- box-sizing reset applied via style to prevent "100++%" scroll issue -->
  <div class="editor-layout" :style="{ gridTemplateColumns: gridLayout }">
    
    <SidebarActions 
      :workflow="workflow"
      :collapsed="leftSidebarCollapsed"
      @add-step="auth.addStep" 
      @select-excel="auth.selectExcel"
      @reset-designer="auth.resetDesigner"
      @toggle="leftSidebarCollapsed = !leftSidebarCollapsed"
    />

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

      <!-- Content Area: Automatically resizes when Sidebars or Console change -->
      <div class="workspace-area">
        <!-- 1. Designer Tab -->
        <section v-if="activeTab === 'editor'" class="canvas-content">
           <StepDesigner 
              :workflow="workflow" 
              v-model:selectedIndex="selectedStepIndex"
              :clipboardStep="clipboardStep"
              @copy="auth.handleCopy"
              @paste="auth.handlePaste"
            />
        </section>

        <!-- 2. Code Editor Tab -->
        <ScriptEditor 
          v-else-if="activeTab === 'preview'" 
          v-model="finalCode"
          :isManualEdit="isManualEdit"
          @reset="isManualEdit = false"
        />

        <!-- 3. Saved Scripts Tab -->
        <SavedScriptsList 
          v-else-if="activeTab === 'saved'" 
          :savedScripts="savedScripts"
          @load="auth.loadScript"
          @run="auth.handleRunManual"
          @delete="auth.handleDelete"
        />
      </div>

      <!-- Console Drawer: Anchored to bottom, pushes workspace up -->
      <ConsoleDrawer 
        v-if="showConsole" 
        :tasks="tasks" 
        :isProcessing="isProcessing"
        @close="showConsole = false"
        @clear="tasks = []"
        @stop="auth.stopAutomation"
      />
    </main>

    <!-- Right Sidebar: Properties -->
    <PropertyEditor
      v-if="!rightSidebarCollapsed"
      :activeStep="activeStep" 
      :workflow="workflow" 
    />
  </div>
</template>

<style scoped>
/* 1. Use border-box to ensure padding doesn't increase width/height */
* {
  box-sizing: border-box;
}

.editor-layout { 
  display: grid; 
  height: 100vh; /* Exactly 100% of viewport height */
  width: 100vw;  /* Exactly 100% of viewport width */
  overflow: hidden; 
  background: #f1f5f9; 
  transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-canvas { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  min-width: 0; /* Critical for preventing children from overflowing grid */
  overflow: hidden; 
}

.workspace-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  position: relative;
}

/* Ensure child views fill the space without double scrolling */
.canvas-content { 
  flex: 1; 
  padding: 2rem; 
  overflow-y: auto; 
  background: #f8fafc; 
}

/* Scrollbar styling for modern look */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
