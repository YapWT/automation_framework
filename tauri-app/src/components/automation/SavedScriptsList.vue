<script setup lang="ts">
import { ref, computed } from 'vue';
// Added 'Type' icon for renaming (looks like text editing)
import { FileCode, Trash2, FolderSearch, Search, X, Edit3, Eye, Type } from 'lucide-vue-next';

const props = defineProps<{
  savedScripts: string[],
  currentOpenedPath: string | null,
  isModified: boolean,
  runningFilePath: string | null,
  selectedFileIndex: number | null 
}>();

const emit = defineEmits(['load', 'run', 'delete', 'update-index', 'rename']); // Added rename emit

const searchQuery = ref("");
const filteredFiles = computed(() => {
  if (!searchQuery.value) return props.savedScripts;
  const q = searchQuery.value.toLowerCase();
  return props.savedScripts.filter(file => file.toLowerCase().includes(q));
});

function handleCardClick(index: number) {
  emit('update-index', index);
}
</script>

<template>
  <section class="saved-view">
    <div class="saved-header">
      <div class="search-wrapper">
        <Search :size="16" class="search-icon" />
        <input v-model="searchQuery" placeholder="Search saved scripts..." class="search-input" />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
          <X :size="14" />
        </button>
      </div>
      <div class="count-badge" v-if="savedScripts.length > 0">
        <span class="count-number">{{ filteredFiles.length }}</span>
        <span class="count-text">{{ filteredFiles.length === 1 ? 'SCRIPT' : 'SCRIPTS' }} FOUND</span>
      </div>
    </div>

    <div v-if="filteredFiles.length === 0" class="empty-saved">
      <FolderSearch :size="48" class="opacity-10 mb-4" />
      <p>No scripts match your search.</p>
    </div>

    <div v-else class="saved-grid">
      <div v-for="(file, index) in filteredFiles" :key="file" class="saved-card" :class="{
        'is-active': file === currentOpenedPath,
        'kb-active': index === selectedFileIndex
      }" @click="handleCardClick(index)">
        
        <div class="file-main-info">
          <span class="file-index-label">{{ index + 1 }}</span>
          <FileCode :size="20" class="text-indigo-500 shrink-0" />
          <div class="flex flex-col overflow-hidden">
            <span class="file-name">{{ file }}</span>
            <div class="hints-row">
              <span v-if="file === runningFilePath" class="hint-badge running"><span class="pulse-dot"></span> RUNNING</span>
              <span v-else-if="file === currentOpenedPath && isModified" class="hint-badge modified"><Edit3 :size="10" /> MODIFIED</span>
              <span v-else-if="file === currentOpenedPath" class="hint-badge active"><Eye :size="10" /> OPENING</span>
            </div>
          </div>
        </div>

        <div class="file-ops">
          <!-- ADDED RENAME BUTTON -->
          <button class="op-btn" @click.stop="emit('rename', file)" title="Rename Script (R)">
            <Type :size="14" />
          </button>
          
          <button class="op-btn" @click.stop="emit('load', file)">Load</button>
          <button class="run-btn" @click.stop="emit('run', file)">Run</button>
          <button class="del-script-btn" @click.stop="emit('delete', file)">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.kb-active {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.file-index-label {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  width: 20px;
  flex-shrink: 0;
  font-family: monospace;
}

/* Maintain existing styles */
.hints-row {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.hint-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hint-badge.active {
  background: #eef2ff;
  color: #6366f1;
}

.hint-badge.modified {
  background: #fff7ed;
  color: #f97316;
}

.hint-badge.running {
  background: #ecfdf5;
  color: #10b981;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.is-active {
  border-color: #7c4746 !important;
  background: #f8faff !important;
}

.is-running {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.saved-view {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.saved-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  transition: 0.2s;
}

.search-wrapper:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
  color: #94a3b8;
}

.search-input {
  border: none;
  background: transparent;
  padding: 10px 8px;
  font-size: 0.85rem;
  width: 100%;
  outline: none;
  color: #1e293b;
}

.clear-search {
  border: none;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.saved-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  width: 100%;
}

.saved-card {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: 0.2s;
}

.saved-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(99, 102, 241, 0.08);
}

.file-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-ops {
  display: flex;
  align-items: center;
  gap: 4px;
}

.op-btn {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px 8px;
}

.op-btn:hover {
  color: #6366f1;
}

.run-btn {
  background: #ecfdf5;
  color: #10b981;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
}

.run-btn:hover {
  background: #d1fae5;
}

.del-script-btn {
  color: #94a3b8;
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px;
}

.del-script-btn:hover {
  color: #ef4444;
  background: #fef2f2;
  border-radius: 6px;
}

.empty-saved {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
.count-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
  user-select: none;
}

.count-number {
  font-size: 0.85rem;
  font-weight: 900;
  color: #6366f1; /* Indigo color to match theme */
}

.count-text {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
}
</style>
