<script setup lang="ts">
import {
    Copy, Trash2, Plus, Zap, ArrowUp, ArrowDown, Undo, Redo
} from 'lucide-vue-next';

const props = defineProps<{
    x: number,
    y: number,
    target: { step: any, index: number | null },
    auth: any
}>();
const emit = defineEmits(['close']);

const add = (type: string) => {
    const idx = props.target.index !== null ? props.target.index + 1 : props.auth.workflow.value.steps.length;
    props.auth.addStep(type, idx);
    emit('close');
};

const duplicate = () => {
    if (props.target.step) {
        props.auth.handleCopy(props.target.step);
        props.auth.handlePaste(props.target.index! + 1);
    }
    emit('close');
};

const move = (dir: 'up' | 'down') => {
    props.auth.moveStep(dir);
    emit('close');
};

const remove = () => {
    if (props.target.index !== null) {
        props.auth.workflow.value.steps.splice(props.target.index, 1);
        props.auth.selectedStepIndex.value = null;
    }
    emit('close');
};
</script>

<template>
    <div class="context-menu" :style="{ top: y + 'px', left: x + 'px' }">
        <div class="scrollable-content">
            <template v-if="target.step">
                <div class="menu-label">Step Actions</div>
                <div class="menu-group">
                    <div class="menu-item" @click="duplicate">
                        <Copy :size="14" /> Duplicate
                    </div>
                    <div class="menu-item" @click="move('up')">
                        <ArrowUp :size="14" /> Move Up
                    </div>
                    <div class="menu-item" @click="move('down')">
                        <ArrowDown :size="14" /> Move Down
                    </div>
                    <div class="menu-item del" @click="remove">
                        <Trash2 :size="14" /> Delete
                    </div>
                </div>
                <div class="menu-divider"></div>
            </template>

            <div class="menu-label">{{ target.step ? 'Insert After' : 'Add Step' }}</div>
            <div class="menu-group">
                <div class="menu-item" @click="props.auth.undo()">
                    <Undo :size="14" /> Undo
                </div>
                <div class="menu-item" @click="props.auth.redo()">
                    <Redo :size="14" /> Redo
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item" @click="add('navigate')">
                    <Plus :size="14" /> Open URL
                </div>
                <div class="menu-item" @click="add('fill')">
                    <Plus :size="14" /> Input Text
                </div>
                <div class="menu-item" @click="add('click')">
                    <Plus :size="14" /> Click Element
                </div>
                <div class="menu-item" @click="add('wait_for')">
                    <Plus :size="14" /> Wait For Element
                </div>
                <div class="menu-item" @click="add('keyboard_press')">
                    <Zap :size="14" /> Key Press
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.context-menu {
    position: fixed;
    z-index: 20000;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    width: 200px;

    max-height: 350px;
    display: flex;
    flex-direction: column;

    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    padding: 4px;
    user-select: none;
    animation: menu-appear 0.1s ease-out;
}

.scrollable-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px;
}

.scrollable-content::-webkit-scrollbar {
    width: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}

.menu-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    border-radius: 8px;
    transition: 0.1s;
}

.menu-item:hover {
    background: #f1f5f9;
    color: #6366f1;
}

.menu-item.del:hover {
    background: #fef2f2;
    color: #ef4444;
}

.menu-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    padding: 8px 12px 4px;
}

.menu-divider {
    height: 1px;
    background: #f1f5f9;
    margin: 4px 8px;
}

@keyframes menu-appear {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
