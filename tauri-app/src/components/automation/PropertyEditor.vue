<script setup lang="ts">
import { MousePointer2, FolderSearch, X } from 'lucide-vue-next';
import { open } from '@tauri-apps/plugin-dialog';
import { STRATEGIES_BY_ACTION as strategiesByAction } from '../../types/automation';

defineProps<{
  activeStep: any,
  workflow: any
}>();

const emit = defineEmits(['close', 'resize-start']);

async function browse(step: any, key: string, isFolder: boolean) {
  const selected = await open({
    directory: isFolder,
    multiple: false
  });
  if (selected) step.params[key] = selected as string;
}
</script>

<template>
  <aside class="sidebar-right">
    <!-- RESIZE HANDLE -->
    <div class="resize-handle" @mousedown="emit('resize-start', $event)"></div>

    <div class="sidebar-main-content">
      <div v-if="activeStep" class="prop-container">
        <!-- HEADER -->
        <div class="prop-section-header">
          <div class="flex items-center gap-2">
            <h3 class="truncate">Properties</h3>
            <span class="action-tag">{{ activeStep.action.toUpperCase() }}</span>
          </div>
          <button class="close-panel-btn" @click="emit('close')" title="Close Properties">
            <X :size="16" />
          </button>
        </div>

        <!-- NEW LOCATION: RUN HEADLESS (Only shown when step is active) -->
        <div class="global-config-top">
          <div class="check-row no-margin" title="Run without opening a visible browser window">
            <input type="checkbox" v-model="workflow.config.headless" id="hd-chk" />
            <label for="hd-chk" class="footer-label">Run Headless Mode</label>
          </div>
        </div>

        <div class="separator-light"></div>

        <!-- Element Index -->
        <div v-if="activeStep.params.index !== undefined" class="input-group">
          <label>Element Index (0 = 1st)</label>
          <input type="number" v-model="activeStep.params.index" min="0" class="styled-input"
            title="Index of the element if multiple matches are found" />
        </div>

        <!-- Finder Strategies -->
        <div v-if="strategiesByAction[activeStep.action]" class="input-group">
          <label>Find element by:</label>
          <select v-model="activeStep.params.matchBy" class="styled-select">
            <option v-for="opt in strategiesByAction[activeStep.action]" :key="opt.id" :value="opt.id">{{ opt.label }}
            </option>
          </select>

          <div class="check-row mt-3" v-if="activeStep.params.exact !== undefined" title="Match the text exactly">
            <input type="checkbox" v-model="activeStep.params.exact" id="ex-chk" />
            <label for="ex-chk">Strict Case Match</label>
          </div>

          <div class="check-row" v-if="activeStep.params.force !== undefined" title="Bypass actionability checks">
            <input type="checkbox" v-model="activeStep.params.force" id="fc-chk" />
            <label for="fc-chk">Force Action</label>
          </div>
        </div>

        <!-- Dynamic Parameters -->
        <div v-for="(_, key) in activeStep.params" :key="key">

          <!-- 2. Wrap 'key' in String() to fix Error 2339 (toUpperCase) and 2345 (Argument mismatch) -->
          <div v-if="!['matchBy', 'exact', 'force', 'timeout', 'index'].includes(String(key))" class="input-group">
            <div class="label-row">

              <!-- Fix: String(key).toUpperCase() -->
              <label>{{ String(key).toUpperCase() }}</label>

              <!-- Fix: String(key) in the includes check and the browse function -->
              <button v-if="['path', 'from', 'to'].includes(String(key))" class="browse-link"
                @click="browse(activeStep, String(key), activeStep.action === 'mkdir')">
                <FolderSearch :size="12" /> Browse
              </button>
            </div>

            <!-- Logic for inputs/selects... -->
            <select v-if="String(key) === 'key'" v-model="activeStep.params[key]" class="styled-select">
              <option value="Enter">Enter</option>
              <option value="Tab">Tab</option>
              <option value="Escape">Escape</option>
              <option value="ArrowDown">Down</option>
              <option value="ArrowUp">Up</option>
              <option value="Backspace">Backspace</option>
            </select>

            <textarea v-else v-model="activeStep.params[key]" rows="4" class="styled-textarea"
              placeholder="Enter value..."></textarea>
          </div>
        </div>

        <div class="tip-box" v-pre>
          <Info :size="14" /><span>Use <b>{{ColumnName}}</b> for data.</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-props">
        <div class="flex flex-col items-center">
          <MousePointer2 :size="32" class="opacity-10 mb-2" />
          <p>Select a step to configure</p>
        </div>
        <button class="close-panel-btn absolute top-4 right-4" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-right {
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.resize-handle {
  position: absolute;
  left: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 50;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: #6366f1;
}

.sidebar-main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

/* NEW STYLES FOR TOP HEADLESS TOGGLE */
.global-config-top {
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.separator-light {
  height: 1px;
  background: #f1f5f9;
  margin-bottom: 1.25rem;
}

.prop-container {
  width: 100%;
}

.close-panel-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.close-panel-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.footer-label {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  cursor: pointer;
  margin-left: 8px;
}

.empty-props {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.8rem;
  position: relative;
}

.prop-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.prop-section-header h3 {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 800;
  margin: 0;
}

.action-tag {
  background: #f1f5f9;
  color: #6366f1;
  font-size: 0.55rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 800;
  text-transform: uppercase;
}

.input-group {
  margin-bottom: 1.25rem;
}

.input-group label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}

.styled-input,
.styled-select,
.styled-textarea {
  width: 95%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.styled-textarea {
  resize: vertical;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.check-row.no-margin {
  margin-bottom: 0;
}

.mt-3 {
  margin-top: 0.75rem;
}

.tip-box {
  background: #f0f9ff;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.7rem;
  color: #0369a1;
  display: flex;
  gap: 10px;
  margin-top: 1.5rem;
  border: 1px solid #bae6fd;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.browse-link {
  background: #f1f5f9;
  border: none;
  color: #6366f1;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

.absolute {
  position: absolute;
}

.top-4 {
  top: 1rem;
}

.right-4 {
  right: 1rem;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
