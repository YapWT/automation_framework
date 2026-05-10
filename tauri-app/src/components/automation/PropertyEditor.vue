<script setup lang="ts">
import { MousePointer2, Info, FolderSearch } from 'lucide-vue-next';
import { open } from '@tauri-apps/plugin-dialog';
import { STRATEGIES_BY_ACTION as strategiesByAction } from '../../types/automation';

const props = defineProps<{ 
  activeStep: any,
  workflow: any 
}>();

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
    <!-- TOP SECTION: SCROLLABLE PROPERTIES -->
    <div class="sidebar-main-content">
      <div v-if="activeStep" class="prop-container">
        <div class="prop-section-header">
          <h3>Properties</h3>
          <span class="action-tag">{{ activeStep.action.toUpperCase() }}</span>
        </div>

        <!-- Element Index -->
        <div v-if="activeStep.params.index !== undefined" class="input-group">
          <label>Element Index (0 = 1st)</label>
          <input 
            type="number" 
            v-model="activeStep.params.index" 
            min="0" 
            class="styled-input" 
            title="Index of the element if multiple matches are found (0 is first)"
          />
        </div>

        <!-- Finder Strategies -->
        <div v-if="strategiesByAction[activeStep.action]" class="input-group">
          <label>Find element by:</label>
          <select 
            v-model="activeStep.params.matchBy" 
            class="styled-select"
            title="Method used to locate the element on the page"
          >
            <option v-for="opt in strategiesByAction[activeStep.action]" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
          
          <!-- Strict Case Match -->
          <div class="check-row mt-3" v-if="activeStep.params.exact !== undefined" title="Match the text exactly, including uppercase/lowercase">
            <input type="checkbox" v-model="activeStep.params.exact" id="ex-chk" />
            <label for="ex-chk">Strict Case Match</label>
          </div>
          
          <!-- Force Action -->
          <div class="check-row" v-if="activeStep.params.force !== undefined" title="Bypass actionability checks (interact with hidden or covered elements)">
            <input type="checkbox" v-model="activeStep.params.force" id="fc-chk" />
            <label for="fc-chk">Force Action</label>
          </div>
        </div>

        <!-- Dynamic Parameters -->
        <div v-for="(val, key) in activeStep.params" :key="key">
          <div v-if="!['matchBy', 'exact', 'force', 'timeout', 'index'].includes(key)" class="input-group">
            <div class="label-row">
              <label>{{ key.toUpperCase() }}</label>
              <button v-if="['path', 'from', 'to'].includes(key)" class="browse-link" @click="browse(activeStep, key, activeStep.action === 'mkdir')">
                <FolderSearch size="12" /> Browse
              </button>
            </div>
            
            <select v-if="key === 'key'" v-model="activeStep.params[key]" class="styled-select" title="The key to be pressed on the keyboard">
              <option value="Enter">Enter</option><option value="Tab">Tab</option><option value="Escape">Escape</option>
              <option value="ArrowDown">Down</option><option value="ArrowUp">Up</option><option value="Backspace">Backspace</option>
            </select>
            <textarea 
              v-else 
              v-model="activeStep.params[key]" 
              rows="4" 
              class="styled-textarea" 
              placeholder="Enter value..."
              title="Input value (supports {{ExcelColumn}} syntax)"
            ></textarea>
          </div>
        </div>

        <div class="tip-box" v-pre><Info size="14" /><span>Use <b>{{ColumnName}}</b> for data.</span></div>
      </div>

      <!-- Center Empty State -->
      <div v-else class="empty-props">
        <MousePointer2 size="32" class="opacity-10 mb-2" />
        <p>Select a step to configure properties</p>
      </div>
    </div>

    <!-- FIXED BOTTOM FOOTER: ALWAYS VISIBLE -->
    <div class="sidebar-footer">
      <div class="check-row">
        <input 
          type="checkbox" 
          v-model="workflow.config.headless" 
          id="hd-chk" 
          title="Run without opening a visible browser window"
        />
        <label for="hd-chk" class="footer-label">Run Headless</label>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-right { 
  background: white; 
  border-left: 1px solid #e2e8f0; 
  padding: 1.25rem; 
  display: flex; 
  flex-direction: column; 
  height: 100%; /* Changed from 100vh to 100% to fit parent grid */
  overflow: hidden; 
}

.sidebar-main-content {
  flex: 1; /* This pushes the footer down */
  overflow-y: auto; /* Only this part scrolls */
  padding-bottom: 1rem;
}

.prop-container { width: 100%; }

.sidebar-footer { 
  flex-shrink: 0; /* Prevent the footer from being compressed */
  padding-top: 1rem; 
  border-top: 1px solid #f1f5f9; 
  background: white;
}

.footer-label {
  font-size: 10px; 
  font-weight: 800; 
  color: #94a3b8; 
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
}

/* Titles and Spacing */
.prop-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.prop-section-header h3 { font-size: 0.9rem; color: #1e293b; font-weight: 800; margin: 0; }
.action-tag { background: #f1f5f9; color: #6366f1; font-size: 0.65rem; padding: 3px 10px; border-radius: 20px; font-weight: 800; text-transform: uppercase; }

/* Form Elements */
.input-group { margin-bottom: 1.25rem; }
.input-group label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 6px; }
.styled-input, .styled-select, .styled-textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; outline: none; }
.styled-textarea { resize: vertical; min-height: 80px; }

.check-row { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 0.8rem; color: #64748b; font-weight: 500; }
.mt-3 { margin-top: 0.75rem; }
.tip-box { background: #f0f9ff; padding: 12px; border-radius: 10px; font-size: 0.7rem; color: #0369a1; display: flex; gap: 10px; border: 1px solid #bae6fd; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
.browse-link { color: #6366f1; border: none; background: none; font-size: 0.65rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; }
</style>
