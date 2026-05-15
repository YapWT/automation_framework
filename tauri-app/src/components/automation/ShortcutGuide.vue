<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    X, Keyboard, MousePointer2, Monitor,
    Terminal, Save, FolderOpen, Zap, Search
} from 'lucide-vue-next';

defineProps<{}>();
const emit = defineEmits(['close']);

const searchQuery = ref("");

const shortcutGroups = [
    {
        title: 'Web Interactions',
        icon: MousePointer2,
        keys: [
            { key: 'Ctrl + 1', desc: 'Navigate to URL' },
            { key: 'Ctrl + 2', desc: 'Fill Input' },
            { key: 'Ctrl + 3', desc: 'Click Element' },
            { key: 'Ctrl + 4', desc: 'Wait for Element' },
            { key: 'Ctrl + 5', desc: 'Upload File' },
            { key: 'Ctrl + 6', desc: 'Download File' },
        ]
    },
    {
        title: 'System & Navigation',
        icon: Monitor,
        keys: [
            { key: 'Ctrl + Shift + 1', desc: 'Key Press Action' },
            { key: 'Ctrl + Shift + 2', desc: 'Create Folder' },
            { key: 'Ctrl + Shift + 3', desc: 'Move File' },
            { key: 'Alt + 1 / 2 / 3', desc: 'Switch Tabs' },
            { key: 'Ctrl + G', desc: 'Go to Step / File' },
        ]
    },
    {
        title: 'Designer Editor',
        icon: Keyboard,
        keys: [
            { key: 'Enter', desc: 'Quick Edit Step' },
            { key: 'Ctrl + C / V', desc: 'Copy / Paste Step' },
            { key: 'Ctrl + M', desc: 'Toggle Move Mode' },
            { key: 'Ctrl + Z / Y', desc: 'Undo / Redo Action' },
            { key: 'Ctrl + R', desc: 'Reset Designer' },
            { key: 'Del / Backspace', desc: 'Remove Step' },
            { key: 'Esc', desc: 'Deselect / Cancel' },
        ]
    },
    {
        title: 'Saved Scripts',
        icon: FolderOpen,
        keys: [
            { key: 'Ctrl + F', desc: 'Find / Search Files' },
            { key: 'Ctrl + L', desc: 'Load Selected File' },
            { key: 'Enter', desc: 'Run Selected File' },
            { key: 'R', desc: 'Rename Selected File' },
            { key: 'Home / PgUp', desc: 'Jump to Top' },
            { key: 'End / PgDn', desc: 'Jump to Bottom' },
            { key: 'Delete / Backspace', desc: 'Remove File' },
            { key: "Esc", desc: 'Deselect / Cancel' }
        ]
    },
    {
        title: 'Workspace & Console',
        icon: Terminal,
        keys: [
            { key: 'Ctrl + S', desc: 'Save Script to Disk' },
            { key: 'Ctrl + Enter', desc: 'Run Current Task' },
            { key: 'Ctrl + J', desc: 'Open / Close Console' },
            { key: 'Ctrl + Delete', desc: 'Clear Console Logs' },
            { key: 'Ctrl + Alt + F', desc: 'Console Fullscreen' },
            { key: 'Ctrl + Q / E', desc: 'Toggle Sidebars' },
        ]
    }
];

const filteredGroups = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return shortcutGroups;

    return shortcutGroups.map(group => ({
        ...group,
        keys: group.keys.filter(k =>
            k.desc.toLowerCase().includes(query) ||
            k.key.toLowerCase().includes(query)
        )
    })).filter(group => group.keys.length > 0);
});
</script>

<template>
    <div class="guide-overlay" @click.self="emit('close')">
        <div class="guide-content">
            <!-- HEADER -->
            <div class="guide-header">
                <div class="header-left">
                    <div class="guide-icon">
                        <Keyboard :size="22" />
                    </div>
                    <div class="header-text">
                        <h2 class="guide-title">Keyboard Shortcuts</h2>
                        <p class="guide-subtitle">Efficiency guide</p>
                    </div>
                </div>
                <button class="close-top-btn" @click="emit('close')">
                    <X :size="20" />
                </button>
            </div>

            <!-- SEARCH BAR -->
            <div class="search-section">
                <div class="search-input-wrapper">
                    <Search :size="18" class="search-icon" />
                    <input v-model="searchQuery" placeholder="Search commands..." autofocus />
                    <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">
                        <X :size="14" />
                    </button>
                </div>
            </div>

            <!-- SCROLLABLE BODY -->
            <div class="guide-body">
                <div v-if="filteredGroups.length === 0" class="no-results">
                    <Search :size="40" class="mb-3 opacity-20" />
                    <p>No results found</p>
                </div>

                <div v-for="group in filteredGroups" :key="group.title" class="guide-group">
                    <div class="group-header">
                        <component :is="group.icon" :size="14" class="group-icon" />
                        <span>{{ group.title }}</span>
                    </div>

                    <!-- FLEXIBLE GRID -->
                    <div class="keys-grid">
                        <div v-for="item in group.keys" :key="item.key" class="key-card">
                            <span class="key-desc">{{ item.desc }}</span>
                            <div class="kbd-list">
                                <template v-for="(k, i) in item.key.split(' ')" :key="i">
                                    <span v-if="k === '+' || k === '/'" class="key-sep">{{ k }}</span>
                                    <kbd v-else>{{ k }}</kbd>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="guide-footer">
                <div class="footer-hint">
                    <Zap :size="14" class="text-amber-500" />
                    <span class="hide-sm">Press <b>?</b> to toggle</span>
                </div>
                <button class="footer-close-btn" @click="emit('close')">Dismiss</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.guide-overlay {
    position: fixed;
    inset: 0;
    background: rgba(9, 9, 11, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.guide-content {
    background: white;
    width: 100%;
    max-width: 800px;
    border-radius: 24px;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 70px -10px rgba(0, 0, 0, 0.3);
}

.guide-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.header-text {
    overflow: hidden;
}

.guide-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
    white-space: nowrap;
}

.guide-subtitle {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0;
}

.search-section {
    padding: 0.75rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0 12px;
}

.search-input-wrapper input {
    width: 100%;
    border: none;
    padding: 10px 0;
    font-size: 0.85rem;
    outline: none;
    color: #1e293b;
}

.guide-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
}

.guide-group {
    margin-bottom: 2rem;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.65rem;
    font-weight: 900;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
}

/* FLEXIBLE GRID SYSTEM */
.keys-grid {
    display: grid;
    /* This tells the grid to make columns at least 280px wide. 
       If there is only room for 1, it will be 1 column. */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
}

.key-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 10px;
    gap: 10px;
}

.key-desc {
    font-size: 0.8rem;
    color: #475569;
    font-weight: 500;
    flex: 1;
}

.kbd-list {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

kbd {
    background: white;
    border: 1px solid #e2e8f0;
    border-bottom: 2px solid #cbd5e1;
    border-radius: 5px;
    padding: 1px 5px;
    font-family: monospace;
    font-weight: 700;
    font-size: 0.65rem;
    color: #1e293b;
    min-width: 20px;
    text-align: center;
}

.guide-footer {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

@media (max-width: 480px) {
    .hide-sm {
        display: none;
    }

    .guide-body {
        padding: 1rem;
    }

    .keys-grid {
        grid-template-columns: 1fr;
    }

    .key-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .kbd-list {
        justify-content: flex-start;
        margin-top: 4px;
    }
}

.close-top-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.guide-icon {
    width: 44px;
    height: 44px;
    background: #6366f1;
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.guide-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
}

.guide-subtitle {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
}

.search-section {
    padding: 1rem 2rem;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
}

.search-input-wrapper:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
    color: #94a3b8;
    margin-right: 10px;
}


.search-clear {
    background: #f1f5f9;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
}

/* BODY */
.guide-body {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
}

.guide-group {
    margin-bottom: 2.5rem;
}

.kbd-list {
    display: flex;
    align-items: center;
    gap: 4px;
}

.key-sep {
    font-size: 0.8rem;
    color: #cbd5e1;
    font-weight: bold;
}

.no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 0;
    color: #94a3b8;
    font-size: 0.9rem;
}

.footer-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: #64748b;
}

.footer-close-btn {
    background: #1e293b;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
}

.footer-close-btn:hover {
    background: #000;
    transform: translateY(-1px);
}

.key-desc {
    font-size: 0.85rem;
    color: #475569;
    font-weight: 500;
}
</style>
