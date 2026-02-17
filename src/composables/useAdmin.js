import CertificateService from '@/services/CertificateService';
import { ref } from 'vue';

export function useAdmin() {
    const certificates = ref([]);
    const stats = ref({ total: 0, issued: 0, revoked: 0 });
    const loading = ref(false);

    const fetchCertificates = async (limit) => {
        loading.value = true;
        try {
            certificates.value = await CertificateService.getRecentCertificates(limit);
        } finally {
            loading.value = false;
        }
    };

    const searchCertificates = async (query) => {
        loading.value = true;
        try {
            certificates.value = await CertificateService.searchCertificates(query);
        } finally {
            loading.value = false;
        }
    };

    const revokeCertificate = async (certId, reason) => {
        loading.value = true;
        try {
            await CertificateService.revokeCertificate(certId, reason);
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
            stats.value = await CertificateService.getCertificateStats();
        } finally {
            loading.value = false;
        }
    };

    return {
        certificates,
        stats,
        loading,
        fetchCertificates,
        searchCertificates,
        revokeCertificate,
        fetchStats
    };
}
