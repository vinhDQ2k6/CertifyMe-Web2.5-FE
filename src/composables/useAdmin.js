import CertificateService from '@/services/CertificateService';
import { ref } from 'vue';

export function useAdmin() {
    const certificates = ref([]);
    const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const stats = ref({ total: 0, issued: 0, revoked: 0 });
    const loading = ref(false);

    const fetchCertificates = async (limit, page = 1) => {
        loading.value = true;
        try {
            const response = await CertificateService.getRecentCertificates(limit, page);
            // API returns: { items: [], pagination: {} }
            certificates.value = response.items || response;
            if (response.pagination) {
                pagination.value = response.pagination;
            }
        } finally {
            loading.value = false;
        }
    };

    const searchCertificates = async (query) => {
        loading.value = true;
        try {
            const response = await CertificateService.searchCertificates(query);
            // API may return paginated or flat array
            certificates.value = response.items || response;
            if (response.pagination) {
                pagination.value = response.pagination;
            }
        } finally {
            loading.value = false;
        }
    };

    const revokeCertificate = async (certId, reason, revokedBy) => {
        loading.value = true;
        try {
            await CertificateService.revokeCertificate(certId, reason, revokedBy);
            const index = certificates.value.findIndex((c) => c.id === certId);
            if (index !== -1) {
                certificates.value[index].status = 'revoked';
            }
        } finally {
            loading.value = false;
        }
    };

    const fetchStats = async () => {
        loading.value = true;
        try {
            const response = await CertificateService.getCertificateStats();
            // Map API field names to component expected names
            stats.value = {
                total: response.totalCertificates ?? response.total ?? 0,
                issued: response.issuedCertificates ?? response.issued ?? 0,
                revoked: response.revokedCertificates ?? response.revoked ?? 0
            };
        } finally {
            loading.value = false;
        }
    };

    return {
        certificates,
        pagination,
        stats,
        loading,
        fetchCertificates,
        searchCertificates,
        revokeCertificate,
        fetchStats
    };
}
