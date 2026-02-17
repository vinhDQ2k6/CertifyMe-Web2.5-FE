<script setup>
import { useRouter } from 'vue-router';

defineProps({
    classes: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'settings', 'view']);
const router = useRouter();

function getStatusSeverity(status) {
    return status === 'active' ? 'success' : 'info';
}

function getStatusLabel(status) {
    return status === 'active' ? '🟢 Active' : '✅ Done';
}

function viewClass(classItem) {
    emit('view', classItem.id);
    router.push({ name: 'classDetail', params: { id: classItem.id } });
}
</script>

<template>
    <DataTable :value="classes" :loading="loading" stripedRows paginator :rows="10">
        <Column field="code" header="Mã lớp" sortable style="min-width: 8rem"></Column>
        <Column field="courseName" header="Khóa học" sortable style="min-width: 12rem"></Column>
        <Column field="studentCount" header="Số SV" sortable style="min-width: 6rem"></Column>
        <Column field="quizCount" header="Số Quiz" sortable style="min-width: 6rem"></Column>
        <Column header="Trạng thái" sortable style="min-width: 8rem">
            <template #body="slotProps">
                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
        </Column>
        <Column header="Hành động" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" size="small" @click="emit('edit', slotProps.data.id)" />
                <Button icon="pi pi-cog" outlined rounded class="mr-2" size="small" @click="emit('settings', slotProps.data.id)" />
                <Button icon="pi pi-eye" outlined rounded size="small" @click="viewClass(slotProps.data)" />
            </template>
        </Column>
    </DataTable>
</template>
