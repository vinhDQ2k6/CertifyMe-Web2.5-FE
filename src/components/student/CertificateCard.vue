<script setup>
defineProps({
    studentName: {
        type: String,
        default: ''
    },
    courseName: {
        type: String,
        default: ''
    },
    courseCode: {
        type: String,
        default: ''
    },
    grade: {
        type: Number,
        default: 0
    },
    completionDate: {
        type: [Date, String],
        default: null
    },
    verificationHash: {
        type: String,
        default: ''
    },
    blockchainInfo: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['download', 'share', 'verify']);

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
}

function truncateHash(hash) {
    if (!hash || hash.length <= 16) return hash;
    return hash.slice(0, 10) + '...' + hash.slice(-6);
}
</script>

<template>
    <Card>
        <template #content>
            <div class="text-center">
                <div class="text-4xl mb-4">🎓</div>
                <div class="text-2xl font-bold text-primary mb-2">CERTIFICATE</div>
                <p class="text-muted-color mb-4">FPT Polytechnic certifies that</p>
                <div class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">{{ studentName }}</div>
                <p class="text-muted-color mb-2">has successfully completed</p>
                <div class="text-xl font-medium text-surface-900 dark:text-surface-0 mb-1">{{ courseName }}</div>
                <span class="text-muted-color text-sm">{{ courseCode }}</span>

                <div class="flex justify-center gap-8 mt-6 mb-4">
                    <div class="text-center">
                        <div class="text-muted-color text-sm">Điểm TB</div>
                        <div class="font-semibold text-lg">{{ grade }}/10</div>
                    </div>
                    <div class="text-center">
                        <div class="text-muted-color text-sm">Ngày cấp</div>
                        <div class="font-semibold text-lg">{{ formatDate(completionDate) }}</div>
                    </div>
                </div>

                <div v-if="verificationHash" class="text-muted-color text-sm mt-4">
                    <span class="font-medium">Verification: </span>
                    <span class="font-mono">{{ truncateHash(verificationHash) }}</span>
                </div>
            </div>

            <div class="flex justify-center gap-3 mt-6">
                <Button label="📥 Download PDF" severity="info" outlined @click="emit('download')" />
                <Button label="🔗 Share" severity="secondary" outlined @click="emit('share')" />
                <Button label="✅ Verify on Chain" severity="success" outlined @click="emit('verify')" />
            </div>
        </template>
    </Card>
</template>
