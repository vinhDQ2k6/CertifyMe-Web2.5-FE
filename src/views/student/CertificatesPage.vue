<script setup>
import CertificateCard from '@/components/student/CertificateCard.vue';
import BlockchainInfo from '@/components/shared/BlockchainInfo.vue';
import { useStudent } from '@/composables/useStudent';
import { useAuth } from '@/composables/useAuth';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import CertificateService from '@/services/CertificateService';

const { user } = useAuth();
const { certificates, loading, fetchCertificates } = useStudent();
const toast = useToast();

const selectedCert = ref(null);
const showBlockchainInfo = ref(false);
const downloading = ref(false);
const verifying = ref(false);

// Mock data for FE-only testing (remove when integrating with BE)
const mockCertificates = [
    {
        id: 'CERT-001',
        studentName: 'Trần Văn B',
        courseName: 'Lập trình Python',
        courseCode: 'SD18101',
        grade: 9.2,
        completionDate: '2025-12-01',
        verificationHash: '0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        blockchainInfo: {
            hash: '0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
            block: '12345678',
            txHash: '0x999888777666555444333222111000aaabbbccc',
            contract: '0xABC123DEF456789012345678901234567890ABCD'
        },
        status: 'issued'
    },
    {
        id: 'CERT-002',
        studentName: 'Trần Văn B',
        courseName: 'Cơ sở dữ liệu',
        courseCode: 'SD18102',
        grade: 8.8,
        completionDate: '2025-12-28',
        verificationHash: '0xaabbcc1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        blockchainInfo: {
            hash: '0xaabbcc1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
            block: '12349000',
            txHash: '0x111222333444555666777888999000aaabbbccc',
            contract: '0xABC123DEF456789012345678901234567890ABCD'
        },
        status: 'issued'
    }
];

onMounted(async () => {
    if (user.value?.id) {
        await fetchCertificates(user.value.id);
    }
    if (certificates.value.length === 0) {
        certificates.value = mockCertificates;
    }
});

function selectCertificate(cert) {
    selectedCert.value = cert;
    showBlockchainInfo.value = false;
}

async function handleDownload(cert) {
    downloading.value = true;
    try {
        await CertificateService.downloadCertificatePDF(cert.id);
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tải xuống chứng chỉ PDF', life: 3000 });
    } catch {
        toast.add({ severity: 'info', summary: 'Thông báo', detail: 'Tính năng tải PDF đang được phát triển', life: 3000 });
    } finally {
        downloading.value = false;
    }
}

async function handleVerify(cert) {
    verifying.value = true;
    try {
        await CertificateService.verifyCertificateOnChain(cert.id);
        showBlockchainInfo.value = true;
        toast.add({ severity: 'success', summary: 'Xác minh thành công', detail: 'Chứng chỉ hợp lệ trên blockchain', life: 3000 });
    } catch {
        showBlockchainInfo.value = true;
        toast.add({ severity: 'info', summary: 'Demo', detail: 'Hiển thị thông tin blockchain (mock)', life: 3000 });
    } finally {
        verifying.value = false;
    }
}

function handleShare(cert) {
    const url = `${window.location.origin}/verify/${cert.verificationHash}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        toast.add({ severity: 'success', summary: 'Đã sao chép', detail: 'Link xác minh đã được sao chép', life: 3000 });
    }
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
}
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Page Header -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center rounded-border bg-green-100 dark:bg-green-400/10" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-id-card text-green-500 text-xl!"></i>
                    </div>
                    <div>
                        <h4 class="m-0 font-bold">🎓 Chứng chỉ của tôi</h4>
                        <span class="text-muted-color text-sm">Tổng cộng {{ certificates.length }} chứng chỉ</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="col-span-12 text-center py-8">
            <ProgressSpinner />
        </div>

        <!-- Empty State -->
        <div v-else-if="certificates.length === 0" class="col-span-12">
            <div class="card text-center py-12">
                <div class="text-5xl mb-4">🔒</div>
                <h5 class="text-muted-color mb-2">Chưa có chứng chỉ</h5>
                <p class="text-muted-color">Hoàn thành tất cả quiz của một khóa học để nhận chứng chỉ</p>
            </div>
        </div>

        <template v-else>
            <!-- Certificate List -->
            <div class="col-span-12 lg:col-span-5">
                <div class="card">
                    <h5 class="mb-4 font-semibold">Danh sách chứng chỉ</h5>
                    <div class="flex flex-col gap-3">
                        <div
                            v-for="cert in certificates"
                            :key="cert.id"
                            :class="[
                                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                                selectedCert?.id === cert.id
                                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                    : 'border-surface-200 dark:border-surface-600 hover:border-primary/50'
                            ]"
                            @click="selectCertificate(cert)"
                        >
                            <div class="text-3xl">🎓</div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">{{ cert.courseName }}</div>
                                <div class="text-muted-color text-sm">{{ cert.courseCode }}</div>
                                <div class="text-muted-color text-xs">📅 {{ formatDate(cert.completionDate) }}</div>
                            </div>
                            <div class="text-right shrink-0">
                                <Tag value="✅ Đạt" severity="success" />
                                <div class="text-sm font-bold mt-1">{{ cert.grade }}/10</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Certificate Detail -->
            <div class="col-span-12 lg:col-span-7">
                <div v-if="!selectedCert" class="card text-center py-12">
                    <div class="text-4xl mb-3">👈</div>
                    <p class="text-muted-color">Chọn một chứng chỉ để xem chi tiết</p>
                </div>

                <div v-else>
                    <CertificateCard
                        :studentName="selectedCert.studentName"
                        :courseName="selectedCert.courseName"
                        :courseCode="selectedCert.courseCode"
                        :grade="selectedCert.grade"
                        :completionDate="selectedCert.completionDate"
                        :verificationHash="selectedCert.verificationHash"
                        :blockchainInfo="selectedCert.blockchainInfo"
                        @download="handleDownload(selectedCert)"
                        @share="handleShare(selectedCert)"
                        @verify="handleVerify(selectedCert)"
                    />

                    <!-- Blockchain Info -->
                    <div v-if="showBlockchainInfo && selectedCert.blockchainInfo" class="mt-4">
                        <BlockchainInfo
                            :verificationHash="selectedCert.blockchainInfo.hash"
                            :blockNumber="selectedCert.blockchainInfo.block"
                            :transactionHash="selectedCert.blockchainInfo.txHash"
                            :contractAddress="selectedCert.blockchainInfo.contract"
                            status="ISSUED"
                        />
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
