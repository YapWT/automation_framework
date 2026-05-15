<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { MousePointer2, Info, FolderSearch, X, Check } from 'lucide-vue-next';
import { open } from '@tauri-apps/plugin-dialog';
import { STRATEGIES_BY_ACTION as strategiesByAction } from '../../types/automation';

const props = defineProps<{ 
  activeStep: any,
  workflow: any 
}>();

const emit = defineEmits(['close']);
const modalRef = ref<HTMLElement | null>(null);

// --- FOCUS TRAP (To keep tabs inside the modal) ---
const handleTabTrap = (e: KeyboardEvent) => {
  if (e.key !== 'Tab' || !modalRef.value) return;
  const focusable = modalRef.value.querySelectorAll('button, input, select, textarea');
  const first = focusable[0] as HTMLElement;
  const last = focusable[focusable.length - 1] as HTMLElement;

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
};

async function browse(step: any, key: string, isFolder: boolean) {
  const selected = await open({ directory: isFolder, multiple: false });
  if (selected) step.params[key] = selected as string;
}

onMounted(() => {
  window.addEventListener('keydown', handleTabTrap);
  const firstInput = modalRef.value?.querySelector('input, select, textarea') as HTMLElement;
  firstInput?.focus();
});

onUnmounted(() => window.removeEventListener('keydown', handleTabTrap));
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content" ref="modalRef">
      
      <!-- HEADER (Matched to Sidebar Header) -->
      <div class="prop-section-header modal-header-padding">
        <div class="flex items-center gap-2">
          <h3>Quick Edit</h3>
          <span class="action-tag">{{ activeStep.action.toUpperCase() }}</span>
        </div>
        <button class="close-panel-btn" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>

      <div class="modal-scroll-area">
        <div class="prop-container">
          
          <!-- GLOBAL CONFIG (Matched to Sidebar) -->
          <div class="global-config-top">
            <div class="check-row no-margin">
              <input type="checkbox" v-model="workflow.config.headless" id="m-hd-chk" />
              <label for="m-hd-chk" class="footer-label">Run Headless Mode</label>
            </div>
          </div>

          <div class="separator-light"></div>

          <!-- ELEMENT INDEX -->
          <div v-if="activeStep.params.index !== undefined" class="input-group">
            <label>Element Index (0 = 1st)</label>
            <input type="number" v-model="activeStep.params.index" min="0" class="styled-input" />
          </div>

          <!-- STRATEGIES -->
          <div v-if="strategiesByAction[activeStep.action]" class="input-group">
            <label>Find element by:</label>
            <select v-model="activeStep.params.matchBy" class="styled-select">
              <option v-for="opt in strategiesByAction[activeStep.action]" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
            </select>
            
            <div class="check-row mt-3" v-if="activeStep.params.exact !== undefined">
              <input type="checkbox" v-model="activeStep.params.exact" id="m-ex-chk" />
              <label for="m-ex-chk">Strict Case Match</label>
            </div>
            
            <div class="check-row" v-if="activeStep.params.force !== undefined">
              <input type="checkbox" v-model="activeStep.params.force" id="m-fc-chk" />
              <label for="m-fc-chk">Force Action</label>
            </div>
          </div>

          <!-- DYNAMIC PARAMETERS -->
          <div v-for="(_, key) in activeStep.params" :key="key">
            <div v-if="!['matchBy', 'exact', 'force', 'timeout', 'index'].includes(String(key))" class="input-group">
              <div class="label-row">
                <label>{{ String(key).toUpperCase() }}</label>
                <button v-if="['path', 'from', 'to'].includes(String(key))" class="browse-link" @click="browse(activeStep, String(key), activeStep.action === 'mkdir')">
                  <FolderSearch :size="12" /> Browse
                </button>
              </div>
              
              <select v-if="String(key) === 'key'" v-model="activeStep.params[key]" class="styled-select">
                <option value="Enter">Enter</option><option value="Tab">Tab</option><option value="Escape">Escape</option>
                <option value="ArrowDown">Down</option><option value="ArrowUp">Up</option><option value="Backspace">Backspace</option>
              </select>

              <textarea v-else v-model="activeStep.params[key]" rows="4" class="styled-textarea" placeholder="Enter value..."></textarea>
            </div>
          </div>

          <div class="tip-box" v-pre><Info :size="14" /><span>Use <b>{{ColumnName}}</b> for data.</span></div>
        </div>
      </div>


    </div>
  </div>
</template>

<style scoped>
/* MODAL LAYOUT */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000;
}
.modal-content {
  background: white; width: 100%; max-width: 480px; border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0;
}
.modal-header-padding { padding: 1.25rem 1.5rem 1rem; border-bottom: 1px solid #f1f5f9; }
.modal-scroll-area { flex: 1; overflow-y: auto; padding: 1.5rem; max-height: 60vh; }
.modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }

/* REPLICATED SIDEBAR STYLES */
.prop-container { width: 100%; }
.prop-section-header { display: flex; justify-content: space-between; align-items: center; }
.prop-section-header h3 { font-size: 0.9rem; color: #1e293b; font-weight: 800; margin: 0; }
.action-tag { background: #f1f5f9; color: #6366f1; font-size: 0.55rem; padding: 2px 8px; border-radius: 20px; font-weight: 800; text-transform: uppercase; }

.global-config-top { background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 1rem; }
.separator-light { height: 1px; background: #f1f5f9; margin-bottom: 1.25rem; }

.input-group { margin-bottom: 1.25rem; }
.input-group label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 6px; }

.styled-input, .styled-select, .styled-textarea { 
  width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; outline: none; background: white;
}
.styled-textarea { resize: vertical; min-height: 80px; }

.check-row { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 0.8rem; color: #64748b; font-weight: 500; }
.no-margin { margin-bottom: 0; }
.mt-3 { margin-top: 0.75rem; }

.tip-box { background: #f0f9ff; padding: 12px; border-radius: 10px; font-size: 0.7rem; color: #0369a1; display: flex; gap: 10px; margin-top: 1.5rem; border: 1px solid #bae6fd; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
.browse-link { background: #f1f5f9; border: none; color: #6366f1; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; }

.close-panel-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
.close-panel-btn:hover { background: #f1f5f9; color: #ef4444; }
.footer-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; cursor: pointer; margin-left: 8px; }

</style>
