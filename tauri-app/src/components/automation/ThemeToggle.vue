<script setup lang="ts">
import { Sun, Moon } from "lucide-vue-next";
import { useTheme } from "../../composables/useTheme";
const { isDark, toggleTheme } = useTheme();
</script>

<template>
    <button
        @click="toggleTheme"
        class="tool-icon-btn"
        :title="isDark ? 'Light Mode' : 'Dark Mode'"
    >
        <Sun v-if="isDark" :size="18" />
        <Moon v-else :size="18" />
    </button>
</template>

<style scoped>

.tool-icon-btn {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
}
.tool-icon-btn:hover {
    background: #f1f5f9;
    color: #6366f1;
}

</style>
