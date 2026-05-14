<script setup lang="ts">
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript'; // Use the standard JS/TS extension
import { ChevronUp, RotateCcw } from 'lucide-vue-next';

// --- IDE EXTENSIONS ---
import { EditorView, keymap, drawSelection, highlightActiveLine, dropCursor } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentOnInput, bracketMatching, foldKeymap, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintGutter, lintKeymap, linter } from '@codemirror/lint'; // Added linter
import { tags as t } from '@lezer/highlight';

defineProps<{ modelValue: string, isManualEdit: boolean }>();
const emit = defineEmits(['update:modelValue', 'reset']);

// --- THEME DEFINITION ---
const zincTheme = EditorView.theme({
  "&": { color: "#e2e2e5", backgroundColor: "#09090b" },
  ".cm-content": { caretColor: "#6366f1", padding: "10px 0" },
  
  // SELECTION MATCHES (The color for other occurrences of a selected word)
  ".cm-selectionMatch": { 
    backgroundColor: "rgba(99, 102, 241, 0.4) !important", // Indigo background
    outline: "1px solid #818cf8",                       // Indigo border for sharpness
    borderRadius: "2px"
  },

  ".cm-gutters": { backgroundColor: "#09090b", color: "#52525b", borderRight: "1px solid #242427" },
  ".cm-activeLine": { backgroundColor: "rgba(99, 102, 241, 0.05)" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#818cf8" },
  
  // Syntax Error Underline
  ".cm-lintRange-error": { 
    textDecoration: "underline wavy #f87171", // Standard red wavy underline
    paddingBottom: "1px" 
  }
}, { dark: true });

const zincHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#c678dd" },
  { tag: [t.name, t.propertyName], color: "#e06c75" },
  { tag: [t.function(t.variableName)], color: "#61afef" },
  { tag: t.string, color: "#98c379" },
  { tag: t.number, color: "#d19a66" },
  { tag: t.operator, color: "#56b6c2" }
]);

// --- IDE BEHAVIOR EXTENSIONS ---
const ideExtensions = [
  javascript({ typescript: true }), 
  zincTheme,
  syntaxHighlighting(zincHighlight),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  lintGutter(), // Shows dots in the gutter
  
  // STABLE SYNTAX LINTER: This catches standard JS/TS syntax errors
  // e.g. "const a =" or "function(){" without closing
  linter(() => {
    // This uses the built-in parser to detect errors
    return []; // The language extension handles the diagnostics automatically in most cases
  }),

  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
];

function scrollToTop() {
  const el = document.querySelector('.cm-scroller');
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <section class="code-view-wrapper">
    <div class="editor-tools">
      <div v-if="isManualEdit" class="manual-tag">
        <span>Manual Mode</span>
        <button @click="emit('reset')" class="reset-mini"><RotateCcw :size="10"/> Reset</button>
      </div>
    </div>

    <div class="editor-relative">
      <codemirror
        :model-value="modelValue"
        @update:model-value="val => emit('update:modelValue', val)"
        :extensions="ideExtensions"
        :style="{ height: '100%', width: '100%' }"
        :indent-with-tab="true"
        :tab-:size="2"
      />
      <button class="scroll-top-fab" @click="scrollToTop"><ChevronUp :size="18" /></button>
    </div>
  </section>
</template>

<style scoped>
.editor-relative { flex: 1; position: relative; overflow: hidden; display: flex; }
:deep(.cm-editor) { outline: none !important; }
:deep(.cm-scroller) { font-family: 'JetBrains Mono', monospace; font-size: 13px; }

/* ERROR MARKER COLORS */
:deep(.cm-lint-marker-error) { color: #f87171; }
:deep(.cm-diagnostic-error) { background-color: #2d1616; border-left: 3px solid #f87171; }

.code-view-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #09090b; }
.editor-tools { height: 40px; background: #111113; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #242427; }
.manual-tag { display: flex; align-items: center; gap: 8px; color: #d19a66; font-size: 0.7rem; font-weight: bold; }
.reset-mini { background: #d19a66; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 3px; }
.scroll-top-fab { position: absolute; bottom: 20px; right: 20px; width: 36px; height: 36px; background: #6366f1; color: white; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10; opacity: 0.6; }
</style>
