<script setup lang="ts">
import { onMounted, watch, toRefs } from 'vue';
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

// Use toRefs to destructure while keeping everything reactive
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
  activeStep
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

</script>

<template>
  <div class="editor-layout">
    <SidebarActions 
      :workflow="workflow" 
      @add-step="auth.addStep" 
      @select-excel="auth.selectExcel"
      @reset-designer="auth.resetDesigner"
    />

    <main class="main-canvas">
      <ScriptHeader 
        v-model:activeTab="activeTab" 
        v-model:workflowName="workflow.name"
        :isRecording="isRecording"
        :showConsole="showConsole"
        :isProcessing="isProcessing"
        @toggle-recording="auth.toggleRecording"
        @toggle-console="showConsole = !showConsole"
        @run="auth.handleRun(true)"
        @save="auth.handleSave"
        @refresh-saved="auth.refreshSaved"
      />

      <!-- Content Area: This section will resize when Console is open -->
      <div class="workspace-area">
        <section v-if="activeTab === 'editor'" class="canvas-content">
           <StepDesigner 
              :workflow="workflow" 
              v-model:selectedIndex="auth.selectedStepIndex.value"
              :clipboardStep="auth.clipboardStep.value"
              @copy="auth.handleCopy"
              @paste="auth.handlePaste"
            />
        </section>

        <ScriptEditor 
          v-else-if="activeTab === 'preview'" 
          v-model="finalCode"
          :isManualEdit="isManualEdit"
          @reset="isManualEdit = false"
        />

      <!-- CENTER: SAVED SCRIPTS -->
        <SavedScriptsList 
          v-else-if="activeTab === 'saved'" 
          :savedScripts="savedScripts"
          @load="auth.loadScript"
          @run="auth.handleRunManual"
          @delete="auth.handleDelete"
        />
      </div>

      <!-- Console Drawer: Pushes workspace-area up -->
      <ConsoleDrawer 
        v-if="showConsole" 
        :tasks="tasks" 
        :isProcessing="isProcessing"
        @close="showConsole = false"
        @clear="tasks = []"
        @stop="auth.stopAutomation"
      />
    </main>

      <PropertyEditor 
        :activeStep="activeStep" 
        :workflow="workflow" 
      />
  </div>
</template>

<style scoped>
.editor-layout { display: grid; grid-template-columns: 240px 1fr 300px; height: 100vh; overflow: hidden; background: #f1f5f9; }
.main-canvas { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.workspace-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  position: relative;
}

.canvas-content { flex: 1; padding: 2rem; overflow-y: auto; background: #f8fafc; }.saved-view { padding: 2rem; overflow-y: auto; flex: 1; }
</style>
