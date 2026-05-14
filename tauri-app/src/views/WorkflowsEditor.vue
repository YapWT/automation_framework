<script setup lang="ts">
import { onMounted, watch, toRefs, computed, ref, nextTick } from 'vue';
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
import { useHotkeys } from '../composables/useHotkeys';
import { useSavedHotkeys } from '../composables/useSavedHotkeys';
import { useConsoleHotkeys } from '../composables/useConsoleHotkeys';

const auth = useAutomation();

const {
  activeTab, workflow, showConsole, isProcessing, isFullscreenConsole,
  tasks, finalCode, isManualEdit, savedScripts, selectedStepIndex,
  activeStep, leftSidebarCollapsed, rightSidebarCollapsed, clipboardStep,
  isModified, runningFilePath, copiedSourceId, isMoveMode
} = toRefs(auth);

useHotkeys(auth);
const { selectedFileIndex } = useSavedHotkeys(auth);
useConsoleHotkeys(auth);

// --- STATE ---
const leftWidth = ref(240);
const rightWidth = ref(300);
const consoleHeight = ref(240);

// --- IMPROVED AUTO-SCROLL LOGIC ---
const scrollToActiveStep = () => {
  nextTick(() => {
    // Target the card that has the 'active' class
    const activeCard = document.querySelector('.step-card.active');
    if (activeCard) {
      activeCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  });
};

// 1. Watch for Step additions (Covers Keyboard shortcuts + Sidebar clicks)
watch(() => workflow.value.steps.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    scrollToActiveStep();
  }
});

// 2. Local Wrapper for Sidebar clicks
const handleSidebarAdd = (type: string) => {
  // Use .value for refs inside the script setup
  const targetIdx = selectedStepIndex.value !== null ? selectedStepIndex.value + 1 : undefined;
  auth.addStep(type, targetIdx);
  // Watcher above will trigger the scroll
};

// --- RESIZING LOGIC ---
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
      if (newHeight < 60) { showConsole.value = false; }
      else {
        showConsole.value = true;
        consoleHeight.value = Math.max(100, Math.min(window.innerHeight * 0.85, newHeight));
      }
    } else if (direction === 'left') {
      const newWidth = startSize + delta;
      if (newWidth < 100) { leftSidebarCollapsed.value = true; }
      else {
        leftSidebarCollapsed.value = false;
        leftWidth.value = Math.max(160, Math.min(500, newWidth));
      }
    } else if (direction === 'right') {
      const newWidth = startSize + delta;
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
  await auth.restoreTempTask();
  await auth.refreshSaved();
  await listen('automation-log', (e) => auth.handleIncomingLog(e.payload as string));
  await listen('automation-finished', () => {
    auth.handleIncomingLog(`TASK:DONE:EXECUTION`);
    auth.isProcessing.value = false;
    auth.runningFilePath.value = null;
  });
});

watch(finalCode, async (newCode) => {
  try {
    await invoke('auto_save_temp', { code: newCode });
  } catch (err) {
    console.error("Auto-save failed", err);
  }
}, { deep: true });
</script>


<template>
  <div class="editor-layout" :style="{ gridTemplateColumns: dynamicGrid }">

    <SidebarActions :workflow="workflow" :collapsed="leftSidebarCollapsed"
      @add-step="(type) => auth.addStep(type, selectedStepIndex !== null ? selectedStepIndex + 1 : undefined)"
      @select-excel="auth.selectExcel" @reset-designer="auth.resetDesigner"
      @toggle="leftSidebarCollapsed = !leftSidebarCollapsed" />

    <div v-if="!leftSidebarCollapsed" class="resizer-h" @mousedown="startResizing('left', $event)"></div>
    <div v-else class="resizer-dummy"></div>

    <main class="main-canvas">
      <ScriptHeader v-model:activeTab="activeTab" v-model:workflowName="workflow.name" :showConsole="showConsole"
        :isProcessing="isProcessing" :rightSidebarCollapsed="rightSidebarCollapsed"
        @toggle-console="showConsole = !showConsole"
        @toggle-right-sidebar="rightSidebarCollapsed = !rightSidebarCollapsed" @run="auth.handleRun(true)"
        @save="auth.handleSave" @refresh-saved="auth.refreshSaved" />

      <div class="workspace-area">
        <section v-if="activeTab === 'editor'" class="canvas-content">
          <StepDesigner :workflow="workflow" v-model:selectedIndex="selectedStepIndex" :clipboardStep="clipboardStep"
            :copiedSourceId="copiedSourceId" :isMoveMode="isMoveMode" @copy="auth.handleCopy"
            @paste="(idx) => { auth.handlePaste(idx); scrollToActiveStep(); }" @cancel-copy="auth.cancelCopy" />
        </section>
        <ScriptEditor v-else-if="activeTab === 'preview'" v-model="finalCode" :isManualEdit="isManualEdit"
          @reset="isManualEdit = false" />
        <SavedScriptsList v-else-if="activeTab === 'saved'" :savedScripts="savedScripts" @rename="auth.handleRename"
          :currentOpenedPath="auth.currentOpenedPath.value" :isModified="auth.isModified.value"
          :runningFilePath="auth.runningFilePath.value" :selectedFileIndex="selectedFileIndex" @load="auth.loadScript"
          @run="auth.handleRunManual" @delete="auth.handleDelete" @update-index="(idx) => selectedFileIndex = idx" />
      </div>

      <ConsoleDrawer v-if="showConsole" :style="{ height: isFullscreenConsole ? '100%' : consoleHeight + 'px' }"
        :tasks="tasks" :isProcessing="isProcessing" :isFullscreen="isFullscreenConsole"
        @resize-start="startResizing('vertical', $event)"
        @toggle-fullscreen="isFullscreenConsole = !isFullscreenConsole" @close="showConsole = false" @clear="tasks = []"
        @stop="auth.stopAutomation" />
    </main>

    <div v-if="!rightSidebarCollapsed" class="resizer-h" @mousedown="startResizing('right', $event)"></div>
    <div v-else class="resizer-dummy"></div>

    <PropertyEditor v-if="!rightSidebarCollapsed" :activeStep="activeStep" :workflow="workflow"
      @close="rightSidebarCollapsed = true" @resize-start="startResizing('right', $event)" />
  </div>

  <transition name="fade">
    <div v-if="auth.activeChord" class="chord-indicator">
      Command Started: Ctrl + {{ auth.activeChord }}... Press 1-5
    </div>
  </transition>
</template>

<style scoped>
.chord-indicator {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #6366f1;
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
  z-index: 9999;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.editor-layout {
  display: grid;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f1f5f9;
}

* {
  box-sizing: border-box;
}

.resizer-h {
  width: 4px;
  cursor: col-resize;
  background: #e2e8f0;
  z-index: 50;
  position: relative;
}

.resizer-h:hover {
  background: #6366f1;
}

.resizer-dummy {
  width: 1px;
  background: transparent;
}

.main-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.workspace-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.canvas-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: #f8fafc;
}
</style>
