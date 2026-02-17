<script setup>
const props = defineProps({
    quizzes: {
        type: Array,
        default: () => []
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['actionClick']);

function getStatusIcon(status) {
    switch (status) {
        case 'completed':
            return '✅';
        case 'pending':
            return '🔓';
        case 'locked':
            return '🔒';
        default:
            return '❓';
    }
}

function getStatusSeverity(status) {
    switch (status) {
        case 'completed':
            return 'success';
        case 'pending':
            return 'info';
        case 'locked':
            return 'warn';
        default:
            return null;
    }
}

function getActionLabel(status) {
    if (props.isCompleted) return 'Xem lại';
    switch (status) {
        case 'completed':
            return 'Xem lại';
        case 'pending':
            return 'Làm bài';
        default:
            return '';
    }
}

function handleAction(quiz) {
    emit('actionClick', { quizId: quiz.id, action: quiz.status === 'completed' ? 'review' : 'start' });
}
</script>

<template>
    <DataTable :value="quizzes" stripedRows>
        <Column header="Trạng thái" style="width: 5rem">
            <template #body="slotProps">
                <Tag :value="getStatusIcon(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
        </Column>
        <Column field="name" header="Tên quiz" sortable></Column>
        <Column header="Điểm" style="width: 8rem">
            <template #body="slotProps">
                <span v-if="slotProps.data.score !== null && slotProps.data.score !== undefined"> {{ slotProps.data.score }}/{{ slotProps.data.maxScore }} </span>
                <span v-else class="text-muted-color">--/{{ slotProps.data.maxScore }}</span>
            </template>
        </Column>
        <Column header="Hành động" style="width: 8rem">
            <template #body="slotProps">
                <Button v-if="slotProps.data.status !== 'locked'" :label="getActionLabel(slotProps.data.status)" size="small" text @click="handleAction(slotProps.data)" />
                <span v-else class="text-muted-color">🔒</span>
            </template>
        </Column>
    </DataTable>
</template>
