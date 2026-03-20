<script setup>
import BlockchainInfo from '@/components/shared/BlockchainInfo.vue';
import CertificateCard from '@/components/student/CertificateCard.vue';
import { useAuth } from '@/composables/useAuth';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useStudent } from '@/composables/useStudent';
import CertificateService from '@/services/CertificateService';
import { onMounted, ref } from 'vue';

const { user } = useAuth();
const { certificates, loading, fetchCertificates } = useStudent();
const { handleError, showSuccess } = useErrorHandler();

const selectedCert = ref(null);
const showBlockchainInfo = ref(false);
const downloading = ref(false);
const verifying = ref(false);

onMounted(async () => {
    try {
        await fetchCertificates(user.value?.userId);
    } catch (err) {
        handleError(err, 'Tải danh sách chứng chỉ');
    }
});

function selectCertificate(cert) {
    selectedCert.value = cert;
    showBlockchainInfo.value = false;
}

async function handleDownload(cert) {
    downloading.value = true;
    try {
        await CertificateService.downloadCertificatePDF(cert.certificateId);
        showSuccess('Thành công', 'Đã tải xuống chứng chỉ PDF');
    } catch (err) {
        handleError(err, 'Tải PDF chứng chỉ');
    } finally {
        downloading.value = false;
    }
}

async function handleVerify(cert) {
    verifying.value = true;
    try {
        await CertificateService.verifyCertificateOnChain(cert.certificateId);
        showBlockchainInfo.value = true;
        showSuccess('Xác minh thành công', 'Chứng chỉ hợp lệ trên blockchain');
    } catch (err) {
        handleError(err, 'Xác minh blockchain');
    } finally {
        verifying.value = false;
    }
}

function handleShare(cert) {
    const url = `${window.location.origin}/verify/${cert.verificationHash}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showSuccess('Đã sao chép', 'Link xác minh đã được sao chép');
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
                            :key="cert.certificateId"
                            :class="[
                                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                                selectedCert?.certificateId === cert.certificateId ? 'border-primary bg-primary/10 dark:bg-primary/20' : 'border-surface-200 dark:border-surface-600 hover:border-primary/50'
                            ]"
                            @click="selectCertificate(cert)"
                        >
                            <div class="text-3xl">🎓</div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">{{ cert.courseName }}</div>
                                <div class="text-muted-color text-sm">{{ cert.courseCode }}</div>
                                <div class="text-muted-color text-xs">📅 {{ formatDate(cert.issuedAt) }}</div>
                            </div>
                            <div class="text-right shrink-0">
                                <Tag value="✅ Đạt" severity="success" />
                                <div class="text-sm font-bold mt-1">{{ cert.averageScore }}/10</div>
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
                        :grade="selectedCert.averageScore"
                        :completionDate="selectedCert.issuedAt"
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
