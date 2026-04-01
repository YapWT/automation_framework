<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

const excelPath = ref('');
const isRunning = ref(false);
const logs = ref<string[]>([]);

async function selectFile() {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (selected) excelPath.value = selected as string;
}

async function runTask() {
  if (!excelPath.value) return;
  isRunning.value = true;
  logs.value.push("Starting automation...");

  try {
    const result = await invoke('start_automation', { path: excelPath.value });
    logs.value.push(`Success: ${result}`);
  } catch (err) {
    logs.value.push(`Error: ${err}`);
  } finally {
    isRunning.value = false;
  }
}
</script>

<template>
  <main class="container">
    <h1>Excel Web Automator</h1>
    
    <div class="card">
      <button @click="selectFile">Select Excel File</button>
      <p v-if="excelPath">Selected: {{ excelPath }}</p>
      
      <button 
        :disabled="!excelPath || isRunning" 
        @click="runTask"
        class="run-btn"
      >
        {{ isRunning ? 'Running...' : 'Start Automation' }}
      </button>
    </div>

    <div class="console">
      <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
    </div>
  </main>
</template>

<style scoped>
.console {
  background: #1e1e1e;
  color: #00ff00;
  padding: 1rem;
  margin-top: 2rem;
  height: 200px;
  overflow-y: auto;
  font-family: monospace;
}
.run-btn { background-color: #4caf50; color: white; }
</style>
