<script setup>
defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'Xác nhận'
    },
    message: {
        type: String,
        default: 'Bạn có chắc chắn muốn thực hiện thao tác này?'
    },
    confirmLabel: {
        type: String,
        default: 'Xác nhận'
    },
    cancelLabel: {
        type: String,
        default: 'Hủy'
    },
    confirmSeverity: {
        type: String,
        default: 'danger'
    },
    icon: {
        type: String,
        default: 'pi pi-exclamation-triangle'
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

function onConfirm() {
    emit('confirm');
}

function onCancel() {
    emit('update:visible', false);
    emit('cancel');
}
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" :style="{ width: '28rem' }" modal :header="title" :closable="!loading">
        <div class="flex items-center gap-4">
            <i :class="[icon, 'text-3xl', confirmSeverity === 'danger' ? 'text-red-500' : 'text-orange-500']"></i>
            <span>{{ message }}</span>
        </div>
        <template #footer>
            <Button :label="cancelLabel" text :disabled="loading" @click="onCancel" />
            <Button :label="confirmLabel" :severity="confirmSeverity" :loading="loading" @click="onConfirm" />
        </template>
    </Dialog>
</template>
