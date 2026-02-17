<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    value: {
        type: [Number, String],
        required: true
    },
    icon: {
        type: String,
        default: 'pi pi-chart-bar'
    },
    iconBgColor: {
        type: String,
        default: 'blue'
    },
    subtitle: {
        type: String,
        default: ''
    },
    trend: {
        type: Object,
        default: null
    }
});

const bgColorMap = {
    blue: 'bg-blue-100 dark:bg-blue-400/10',
    orange: 'bg-orange-100 dark:bg-orange-400/10',
    cyan: 'bg-cyan-100 dark:bg-cyan-400/10',
    purple: 'bg-purple-100 dark:bg-purple-400/10',
    green: 'bg-green-100 dark:bg-green-400/10',
    red: 'bg-red-100 dark:bg-red-400/10'
};

const textColorMap = {
    blue: 'text-blue-500',
    orange: 'text-orange-500',
    cyan: 'text-cyan-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    red: 'text-red-500'
};
</script>

<template>
    <div class="card mb-0">
        <div class="flex justify-between mb-4">
            <div>
                <span class="block text-muted-color font-medium mb-4">{{ title }}</span>
                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ value }}</div>
            </div>
            <div class="flex items-center justify-center rounded-border" :class="bgColorMap[iconBgColor] || bgColorMap.blue" style="width: 2.5rem; height: 2.5rem">
                <i :class="[icon, textColorMap[iconBgColor] || textColorMap.blue, 'text-xl!']"></i>
            </div>
        </div>
        <template v-if="trend">
            <span class="text-primary font-medium">{{ trend.value }} </span>
            <span class="text-muted-color">{{ trend.label }}</span>
        </template>
        <span v-else-if="subtitle" class="text-muted-color">{{ subtitle }}</span>
    </div>
</template>
