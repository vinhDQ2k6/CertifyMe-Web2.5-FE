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
        case 'PASSED':
        case 'COMPLETED':
            return '✅';
        case 'ACTIVE':
        case 'PENDING':
            return '🔓';
        case 'LOCKED':
            return '🔒';
        default:
            return '❓';
    }
}

function getStatusSeverity(status) {
    switch (status) {
        case 'PASSED':
        case 'COMPLETED':
            return 'success';
        case 'ACTIVE':
        case 'PENDING':
            return 'info';
        case 'LOCKED':
            return 'warn';
        default:
            return null;
    }
}

function getActionLabel(status) {
    if (props.isCompleted) return 'Xem lại';
    switch (status) {
        case 'PASSED':
        case 'COMPLETED':
            return 'Xem lại';
        case 'ACTIVE':
        case 'PENDING':
            return 'Làm bài';
        default:
            return '';
    }
}

function handleAction(quiz) {
    emit('actionClick', { quizId: quiz.quizId, action: quiz.status === 'PASSED' || quiz.status === 'COMPLETED' ? 'review' : 'start' });
}
</script>

<template>
    <DataTable :value="quizzes" stripedRows>
        <Column header="Trạng thái" style="width: 5rem">
            <template #body="slotProps">
                <Tag :value="getStatusIcon(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
        </Column>
        <Column field="quizName" header="Tên quiz" sortable></Column>
        <Column header="Điểm" style="width: 8rem">
            <template #body="slotProps">
                <span v-if="slotProps.data.score !== null && slotProps.data.score !== undefined"> {{ slotProps.data.score }}/{{ slotProps.data.maxScore }} </span>
                <span v-else class="text-muted-color">--/{{ slotProps.data.maxScore }}</span>
            </template>
        </Column>
        <Column header="Hành động" style="width: 8rem">
            <template #body="slotProps">
                <Button v-if="slotProps.data.status !== 'LOCKED' && slotProps.data.status !== 'locked'" :label="getActionLabel(slotProps.data.status)" size="small" text @click="handleAction(slotProps.data)" />
                <span v-else class="text-muted-color">🔒</span>
            </template>
        </Column>
    </DataTable>
</template>
