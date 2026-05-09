<script setup lang="ts">
import { ref, computed } from 'vue';
import { FileCode, Trash2, FolderSearch, Search, X } from 'lucide-vue-next';

const props = defineProps<{
  savedScripts: string[]
}>();

const emit = defineEmits(['load', 'run', 'delete']);

// 1. Local Search State
const searchQuery = ref("");

// 2. Filter Logic
const filteredFiles = computed(() => {
  if (!searchQuery.value) return props.savedScripts;
  const q = searchQuery.value.toLowerCase();
  return props.savedScripts.filter(file => file.toLowerCase().includes(q));
});
</script>

<template>
  <section class="saved-view">
    <!-- SEARCH HEADER -->
    <div class="saved-header">
      <div class="search-wrapper">
        <Search size="16" class="search-icon" />
        <input 
          v-model="searchQuery" 
          placeholder="Search saved scripts..." 
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
          <X size="14" />
        </button>
      </div>
      <div class="count-badge">{{ filteredFiles.length }} scripts</div>
    </div>

    <!-- Empty State (No Files at all) -->
    <div v-if="savedScripts.length === 0" class="empty-saved">
      <FolderSearch size="48" class="opacity-10 mb-4" />
      <p>No saved scripts found.</p>
    </div>

    <!-- Empty State (No Search Results) -->
    <div v-else-if="filteredFiles.length === 0" class="empty-saved">
      <Search size="48" class="opacity-10 mb-4" />
      <p>No scripts match "{{ searchQuery }}"</p>
    </div>

    <!-- Grid of Filtered Scripts -->
    <div v-else class="saved-grid">
      <div v-for="file in filteredFiles" :key="file" class="saved-card">
        <div class="file-main-info">
          <FileCode size="20" class="text-indigo-500 shrink-0" />
          <span class="file-name" :title="file">{{ file }}</span>
        </div>

        <div class="file-ops">
          <button class="op-btn" @click="emit('load', file)">Load</button>
          <button class="run-btn" @click="emit('run', file)">Run</button>
          <button class="del-script-btn" @click="emit('delete', file)">
            <Trash2 size="14" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.saved-view {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* SEARCH STYLES */
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

.count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  background: #e2e8f0;
  padding: 4px 10px;
  border-radius: 20px;
}

/* GRID STYLES */
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

.op-btn:hover { color: #6366f1; }

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

.run-btn:hover { background: #d1fae5; }

.del-script-btn {
  color: #94a3b8;
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px;
}

.del-script-btn:hover { color: #ef4444; background: #fef2f2; border-radius: 6px; }

.empty-saved {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
</style>
