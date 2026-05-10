<script setup lang="ts">
import { ref } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Search, ChevronUp, RotateCcw } from 'lucide-vue-next';

const props = defineProps<{ modelValue: string, isManualEdit: boolean }>();
const emit = defineEmits(['update:modelValue', 'reset']);

function scrollToTop() {
  const el = document.querySelector('.cm-scroller');
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <section class="code-view-wrapper">
    <!-- TOP TOOLBAR: FIND FEATURE -->
    <div class="editor-tools">
      <div v-if="isManualEdit" class="manual-tag">
        <span>Manual Mode</span>
        <button @click="emit('reset')" class="reset-mini"><RotateCcw size="10"/> Reset</button>
      </div>
    </div>

    <div class="editor-relative">
      <codemirror
        :model-value="modelValue"
        @update:model-value="val => emit('update:modelValue', val)"
        :extensions="[javascript(), oneDark]"
        :style="{ height: '100%', width: '100%' }"
      />
      
      <button class="scroll-top-fab" @click="scrollToTop" title="Scroll to Top">
        <ChevronUp size="18" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.code-view-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #282c34; }
.editor-tools { height: 40px; background: #21252b; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #181a1f; }
.manual-tag { display: flex; align-items: center; gap: 8px; color: #d19a66; font-size: 0.7rem; font-weight: bold; }
.reset-mini { background: #d19a66; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 3px; }
.editor-relative { flex: 1; position: relative; overflow: hidden; }
.scroll-top-fab { position: absolute; bottom: 20px; right: 20px; width: 36px; height: 36px; background: #61afef; color: white; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10; }
</style>
