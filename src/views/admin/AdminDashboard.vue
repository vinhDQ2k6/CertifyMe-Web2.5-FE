<script setup>
import CertificateTable from '@/components/admin/CertificateTable.vue';
import StatsCard from '@/components/shared/StatsCard.vue';
import { useAdmin } from '@/composables/useAdmin';
import { onMounted, ref } from 'vue';

const { certificates, stats, loading, fetchCertificates, searchCertificates, fetchStats } = useAdmin();
const searchQuery = ref('');

// Mock data for FE-only testing (remove when integrating with BE)
const mockStats = { total: 156, issued: 150, revoked: 6 };

const mockCertificates = [
    { id: 'CERT-156', studentName: 'Nguyễn Văn An', studentEmail: 'annv@fpt.edu.vn', className: 'SD18301', courseCode: 'Java 6', gradeAverage: 8.5, issueDate: '2026-02-15', status: 'issued', blockchainHash: '0x7a8b9c1d...' },
    { id: 'CERT-155', studentName: 'Trần Thị Bình', studentEmail: 'binhtt@fpt.edu.vn', className: 'SD18301', courseCode: 'Java 6', gradeAverage: 9.0, issueDate: '2026-02-15', status: 'issued', blockchainHash: '0x8b9c0d1e...' },
    { id: 'CERT-154', studentName: 'Lê Văn Cường', studentEmail: 'cuonglv@fpt.edu.vn', className: 'SD18302', courseCode: 'React 3', gradeAverage: 7.8, issueDate: '2026-02-14', status: 'issued', blockchainHash: '0x9c0d1e2f...' },
    { id: 'CERT-100', studentName: 'Phạm Thị Dung', studentEmail: 'dungpt@fpt.edu.vn', className: 'SD18201', courseCode: 'Web 5', gradeAverage: 8.0, issueDate: '2026-01-01', status: 'revoked', blockchainHash: '0xa0b1c2d3...' },
    { id: 'CERT-099', studentName: 'Hoàng Minh Đức', studentEmail: 'duchm@fpt.edu.vn', className: 'SD18201', courseCode: 'Web 5', gradeAverage: 9.5, issueDate: '2025-12-28', status: 'issued', blockchainHash: '0xb1c2d3e4...' }
];

onMounted(async () => {
    try {
        await fetchStats();
        await fetchCertificates(20);
    } catch {
        // ignore API errors in FE-only mode
    }
    // Use mock data if nothing loaded from API
    if (stats.value.total === 0) {
        stats.value = mockStats;
    }
    if (certificates.value.length === 0) {
        certificates.value = mockCertificates;
    }
});

async function handleSearch() {
    if (searchQuery.value.trim()) {
        try {
            await searchCertificates(searchQuery.value.trim());
        } catch {
            // Fallback: filter mock data locally for FE-only testing
            const q = searchQuery.value.trim().toLowerCase();
            certificates.value = mockCertificates.filter((c) => c.id.toLowerCase().includes(q) || c.studentEmail.toLowerCase().includes(q) || c.studentName.toLowerCase().includes(q));
        }
    } else {
        certificates.value = mockCertificates;
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
