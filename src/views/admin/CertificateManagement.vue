<script setup>
import CertificateDetail from '@/components/admin/CertificateDetail.vue';
import BlockchainInfo from '@/components/shared/BlockchainInfo.vue';
import RevokeDialog from '@/components/admin/RevokeDialog.vue';
import CertificateService from '@/services/CertificateService';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const certificate = ref(null);
const loading = ref(false);
const revokeDialogVisible = ref(false);
const revokeLoading = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        certificate.value = await CertificateService.getCertificateDetail(route.params.id);
    } finally {
        loading.value = false;
    }
});

function goBack() {
    router.push({ name: 'adminDashboard' });
}

function openRevokeDialog() {
    revokeDialogVisible.value = true;
}

async function handleRevoke({ reason }) {
    revokeLoading.value = true;
    try {
        await CertificateService.revokeCertificate(route.params.id, reason);
        certificate.value.status = 'revoked';
        revokeDialogVisible.value = false;
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bằng đã được thu hồi', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thu hồi bằng', life: 3000 });
    } finally {
        revokeLoading.value = false;
    }
}
</script>

<template>
    <div>
        <!-- Header -->
        <Button label="← Quay lại" text class="mb-4" @click="goBack" />

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="certificate">
            <h3 class="mb-4">🎓 CHI TIẾT BẰNG: {{ certificate.id }}</h3>

            <!-- Certificate Details -->
            <div class="mb-4">
                <CertificateDetail :certificate="certificate" />
            </div>

            <!-- Blockchain Info -->
            <div v-if="certificate.blockchainInfo" class="mb-4">
                <BlockchainInfo
                    :verificationHash="certificate.blockchainInfo.hash || certificate.blockchainHash"
                    :blockNumber="certificate.blockchainInfo.block"
                    :transactionHash="certificate.blockchainInfo.txHash"
                    :contractAddress="certificate.blockchainInfo.contract"
                    :status="certificate.status === 'issued' ? 'ISSUED' : 'REVOKED'"
                />
            </div>

            <!-- Revoke Section -->
            <div v-if="certificate.status === 'issued'" class="card">
                <h5 class="mb-4 text-orange-500">⚠️ THU HỒI BẰNG</h5>
                <p class="text-muted-color mb-4">Hành động này không thể hoàn tác. Bằng sẽ bị đánh dấu là thu hồi trên blockchain.</p>
                <Button label="❌ Thu hồi bằng" severity="danger" @click="openRevokeDialog" />
            </div>

            <div v-else class="card">
                <div class="flex items-center gap-3 text-red-500">
                    <i class="pi pi-ban text-2xl"></i>
                    <span class="font-medium">Bằng này đã bị thu hồi</span>
                </div>
            </div>
        </div>

        <!-- Revoke Dialog -->
        <RevokeDialog v-model:visible="revokeDialogVisible" :certificateId="route.params.id" :loading="revokeLoading" @confirm="handleRevoke" @cancel="revokeDialogVisible = false" />
    </div>
</template>
