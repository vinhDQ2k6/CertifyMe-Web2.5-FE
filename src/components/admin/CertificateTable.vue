<script setup>
import { useRouter } from 'vue-router';

defineProps({
    certificates: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    paginated: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['view', 'revoke']);
const router = useRouter();

function getStatusSeverity(status) {
    return status === 'issued' ? 'success' : 'danger';
}

function getStatusLabel(status) {
    return status === 'issued' ? '✅ Issued' : '❌ Revoked';
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
}

function viewCertificate(cert) {
    emit('view', cert.id);
    router.push({ name: 'certificateDetail', params: { id: cert.id } });
}
</script>

<template>
    <DataTable :value="certificates" :loading="loading" stripedRows :paginator="paginated" :rows="10">
        <Column field="id" header="Cert ID" sortable style="min-width: 8rem"></Column>
        <Column field="studentName" header="Sinh viên" sortable style="min-width: 12rem"></Column>
        <Column field="className" header="Mã lớp" sortable style="min-width: 8rem"></Column>
        <Column header="Ngày cấp" sortable style="min-width: 8rem">
            <template #body="slotProps">
                {{ formatDate(slotProps.data.issueDate) }}
            </template>
        </Column>
        <Column header="Trạng thái" style="min-width: 8rem">
            <template #body="slotProps">
                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
        </Column>
        <Column header="Hành động" style="min-width: 10rem">
            <template #body="slotProps">
                <Button icon="pi pi-eye" outlined rounded class="mr-2" size="small" @click="viewCertificate(slotProps.data)" />
                <Button icon="pi pi-ban" outlined rounded severity="danger" size="small" :disabled="slotProps.data.status === 'revoked'" @click="emit('revoke', slotProps.data.id)" />
            </template>
        </Column>
    </DataTable>
</template>
