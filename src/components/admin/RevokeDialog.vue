<script setup>
import { ref } from 'vue';

defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    certificateId: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['confirm', 'cancel', 'update:visible']);

const reason = ref('');

function handleConfirm() {
    emit('confirm', { certificateId: emit.certificateId, reason: reason.value });
    reason.value = '';
}

function handleCancel() {
    reason.value = '';
    emit('cancel');
    emit('update:visible', false);
}
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" :style="{ width: '500px' }" header="Xác nhận thu hồi bằng" :modal="true">
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3 text-orange-500">
                <i class="pi pi-exclamation-triangle text-3xl!"></i>
                <span class="font-medium">Bạn đang thu hồi bằng: {{ certificateId }}</span>
            </div>

            <div>
                <label for="revokeReason" class="block font-medium mb-2">Lý do thu hồi</label>
                <Textarea id="revokeReason" v-model="reason" rows="3" class="w-full" placeholder="Nhập lý do thu hồi..." />
            </div>

            <div class="bg-orange-50 dark:bg-orange-400/10 p-3 rounded-lg">
                <span class="text-orange-600 dark:text-orange-400 font-medium">⚠️ Hành động này không thể hoàn tác!</span>
            </div>
        </div>

        <template #footer>
            <Button label="Hủy" text @click="handleCancel" />
            <Button label="❌ Thu hồi bằng" severity="danger" :loading="loading" :disabled="!reason" @click="handleConfirm" />
        </template>
    </Dialog>
</template>
