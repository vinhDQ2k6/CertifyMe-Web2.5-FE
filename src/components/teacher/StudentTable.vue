<script setup>
defineProps({
    students: {
        type: Array,
        default: () => []
    },
    classId: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    }
});

function getStatusSeverity(status) {
    switch (status) {
        case 'passed':
            return 'success';
        case 'learning':
            return 'info';
        case 'incomplete':
            return 'danger';
        default:
            return null;
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'passed':
            return '✅ PASSED';
        case 'learning':
            return '📖 Learning';
        case 'incomplete':
            return '❌ Incomplete';
        default:
            return status;
    }
}
</script>

<template>
    <DataTable :value="students" :loading="loading" stripedRows paginator :rows="10">
        <Column header="STT" style="width: 4rem">
            <template #body="slotProps">
                {{ slotProps.index + 1 }}
            </template>
        </Column>
        <Column field="name" header="Họ tên" sortable style="min-width: 12rem"></Column>
        <Column field="email" header="Email" sortable style="min-width: 14rem"></Column>
        <Column header="Tiến độ" style="min-width: 8rem">
            <template #body="slotProps"> {{ slotProps.data.completedQuizzes }}/{{ slotProps.data.totalQuizzes }} quiz </template>
        </Column>
        <Column header="Trạng thái" style="min-width: 10rem">
            <template #body="slotProps">
                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
        </Column>
    </DataTable>
</template>
