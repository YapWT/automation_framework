<script setup lang="ts">
import { ref } from 'vue'
// Correcting paths: if App.vue is in /src, assets are in ./assets/
const count = ref(0)
const status = ref('System Online')
</script>

<template>
  <div class="container">
    <!-- Header with Logos -->
    <header class="header">
      <div class="logos">
      </div>
      <h1>Automation Framework</h1>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h2>Dashboard Overview</h2>
        <p>
          Welcome to your automated testing environment. This framework is 
          designed to run smooth, cross-platform desktop tests using Tauri 
          and Playwright.
        </p>
        
        <div class="status-box">
          <span class="status-dot"></span>
          <strong>Status:</strong> {{ status }}
        </div>
      </div>
    </section>

    <!-- Action Section -->
    <section class="actions">
      <div class="card">
        <h3>Test Runner</h3>
        <p>Current test iterations completed during this session.</p>
        <button class="btn-primary" @click="count++">
          Run Dummy Test (Count: {{ count }})
        </button>
      </div>

      <div class="card">
        <h3>Logs</h3>
        <p>Edit <code>src/App.vue</code> to begin building your custom UI.</p>
        <p class="dummy-text">
          Lorum ipsum dolor sit amet, consectetur adipiscing elit. 
          The framework is currently listening for system commands...
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.container {
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  color: #2c3e50;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.logos {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.logo {
  height: 3em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.hero-section {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  gap: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
}

.hero-image {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
}

.status-box {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #e3f2fd;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1976d2;
}

.status-dot {
  width: 10px;
  height: 10px;
  background: #4caf50;
  border-radius: 50%;
  box-shadow: 0 0 8px #4caf50;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.card {
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.btn-primary {
  background-color: #646cff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background-color: #535bf2;
}

.dummy-text {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}
</style>
