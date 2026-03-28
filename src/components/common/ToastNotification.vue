<script setup>
import { ref } from 'vue';

const toasts = ref([]);
let counter = 0;

function add({ severity = 'info', summary = '', detail = '', life = 3000 } = {}) {
    const id = ++counter;
    toasts.value.push({ id, severity, summary, detail, life });
    if (life > 0) {
        setTimeout(() => remove(id), life);
    }
}

function remove(id) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
}

defineExpose({ add, remove });

const severityIconMap = {
    success: 'pi pi-check-circle',
    info: 'pi pi-info-circle',
    warn: 'pi pi-exclamation-triangle',
    error: 'pi pi-times-circle'
};

const severityBgMap = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-500',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
    warn: 'bg-orange-50 dark:bg-orange-900/20 border-orange-500',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-500'
};

const severityTextMap = {
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    warn: 'text-orange-600 dark:text-orange-400',
    error: 'text-red-600 dark:text-red-400'
};
</script>

<template>
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 min-w-72 max-w-sm">
        <TransitionGroup name="toast">
            <div v-for="toast in toasts" :key="toast.id" :class="['flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-md', severityBgMap[toast.severity] || severityBgMap.info]">
                <i :class="[severityIconMap[toast.severity] || severityIconMap.info, 'text-lg mt-0.5', severityTextMap[toast.severity] || severityTextMap.info]"></i>
                <div class="flex-1 min-w-0">
                    <div v-if="toast.summary" :class="['font-semibold text-sm', severityTextMap[toast.severity]]">{{ toast.summary }}</div>
                    <div v-if="toast.detail" class="text-sm text-surface-700 dark:text-surface-300">{{ toast.detail }}</div>
                </div>
                <button class="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 ml-auto" @click="remove(toast.id)">
                    <i class="pi pi-times text-xs"></i>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}
.toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
}
.toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
}
</style>
