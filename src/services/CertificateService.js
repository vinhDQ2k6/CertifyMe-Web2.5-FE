import { fetchResource, createResource } from '@/lib/apiFetcher';

const CertificateService = {
    async getCertificatesForStudent(studentId) {
        return await fetchResource(`/student/${studentId}/certificates`);
    },

    async getCertificateDetail(certId) {
        return await fetchResource(`/certificates/${certId}`);
    },

    async searchCertificates(query) {
        return await fetchResource('/certificates/search', { params: { q: query } });
    },

    async getRecentCertificates(limit = 10) {
        return await fetchResource('/certificates/recent', { params: { limit } });
    },

    async verifyCertificateOnChain(certId) {
        return await createResource(`/certificates/${certId}/verify`, {});
    },

    async downloadCertificatePDF(certId) {
        return await fetchResource(`/certificates/${certId}/pdf`, { responseType: 'blob' });
    },

    async revokeCertificate(certId, reason) {
        return await createResource(`/certificates/${certId}/revoke`, { reason });
    },

    async getCertificateStats() {
        return await fetchResource('/admin/certificates/stats');
    }
};

export default CertificateService;
