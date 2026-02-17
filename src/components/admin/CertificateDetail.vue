<script setup>
defineProps({
    certificate: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
}
</script>

<template>
    <Card>
        <template #content>
            <div v-if="loading" class="text-center py-8">
                <ProgressSpinner />
            </div>
            <div v-else-if="certificate" class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">👤 Sinh viên:</span>
                    <span>{{ certificate.studentName }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">📧 Email:</span>
                    <span>{{ certificate.studentEmail }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">📚 Lớp:</span>
                    <span>{{ certificate.className }} - {{ certificate.courseCode }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">📅 Ngày cấp:</span>
                    <span>{{ formatDate(certificate.issueDate) }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">📊 Điểm TB:</span>
                    <span>{{ certificate.gradeAverage }}/10</span>
                </div>
            </div>
        </template>
    </Card>
</template>
