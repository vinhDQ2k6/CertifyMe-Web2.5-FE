<script setup>
defineProps({
    message: {
        type: String,
        default: 'Đã xảy ra lỗi'
    },
    severity: {
        type: String,
        default: 'error',
        validator: (v) => ['error', 'warn', 'info'].includes(v)
    },
    showIcon: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['retry']);

const iconMap = {
    error: 'pi pi-times-circle',
    warn: 'pi pi-exclamation-triangle',
    info: 'pi pi-info-circle'
};

const severityMap = {
    error: 'error',
    warn: 'warn',
    info: 'info'
};
</script>

<template>
    <div class="flex flex-col items-center justify-center py-8 gap-3">
        <Message :severity="severityMap[severity]" class="w-full">
            <template #messageicon>
                <i v-if="showIcon" :class="iconMap[severity]" class="mr-2" />
            </template>
            {{ message }}
        </Message>
        <Button v-if="severity === 'error'" label="Thử lại" icon="pi pi-refresh" severity="secondary" outlined size="small" @click="emit('retry')" />
    </div>
</template>
