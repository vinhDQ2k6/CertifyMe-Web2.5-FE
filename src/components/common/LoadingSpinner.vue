<script setup>
defineProps({
    size: {
        type: String,
        default: 'medium',
        validator: (v) => ['small', 'medium', 'large'].includes(v)
    },
    message: {
        type: String,
        default: ''
    },
    fullPage: {
        type: Boolean,
        default: false
    }
});

const sizeMap = {
    small: '1.5rem',
    medium: '3rem',
    large: '5rem'
};
</script>

<template>
    <div :class="['flex flex-col items-center justify-center gap-3', fullPage ? 'min-h-screen' : 'py-8']">
        <ProgressSpinner :style="{ width: sizeMap[size], height: sizeMap[size] }" strokeWidth="4" />
        <span v-if="message" class="text-muted-color text-sm">{{ message }}</span>
    </div>
</template>
