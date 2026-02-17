<script setup>
import CertificateTable from '@/components/admin/CertificateTable.vue';
import StatsCard from '@/components/shared/StatsCard.vue';
import { useAdmin } from '@/composables/useAdmin';
import { onMounted, ref } from 'vue';

const { certificates, stats, loading, fetchCertificates, searchCertificates, fetchStats } = useAdmin();
const searchQuery = ref('');

onMounted(async () => {
    await fetchStats();
    await fetchCertificates(20);
});

async function handleSearch() {
    if (searchQuery.value.trim()) {
        await searchCertificates(searchQuery.value.trim());
    } else {
        await fetchCertificates(20);
    }
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Section -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <StatsCard title="Tổng bằng" :value="stats.total || 0" icon="pi pi-id-card" iconBgColor="blue" subtitle="Tổng số bằng cấp" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <StatsCard title="Đã cấp" :value="stats.issued || 0" icon="pi pi-check-circle" iconBgColor="green" subtitle="Bằng đang có hiệu lực" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <StatsCard title="Thu hồi" :value="stats.revoked || 0" icon="pi pi-times-circle" iconBgColor="red" subtitle="Bằng đã thu hồi" />
        </div>

        <!-- Search Section -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex gap-2">
                    <IconField class="flex-1">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="searchQuery" placeholder="Nhập Cert ID hoặc email..." class="w-full" @keyup.enter="handleSearch" />
                    </IconField>
                    <Button label="Tìm" icon="pi pi-search" @click="handleSearch" />
                </div>
            </div>
        </div>

        <!-- Certificates Table -->
        <div class="col-span-12">
            <div class="card">
                <h5 class="mb-4">📋 DANH SÁCH BẰNG GẦN ĐÂY</h5>
                <CertificateTable :certificates="certificates" :loading="loading" />
            </div>
        </div>
    </div>
</template>
