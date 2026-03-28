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

    /**
     * Get recent certificates with pagination
     * API: GET /api/certificates/recent?limit=10&page=1
     */
    async getRecentCertificates(limit = 10, page = 1) {
        return await fetchResource('/certificates/recent', { params: { limit, page } });
    },

    async verifyCertificateOnChain(certId) {
        return await createResource(`/certificates/${certId}/verify`, {});
    },

    async downloadCertificatePDF(certId) {
        return await fetchResource(`/certificates/${certId}/pdf`, { responseType: 'blob' });
    },

    /**
     * Revoke a certificate
     * API: POST /api/certificates/{certificateId}/revoke
     * @param {string} certId - Certificate ID
     * @param {string} reason - Reason for revocation
     * @param {string} revokedBy - Admin user ID who is revoking
     */
    async revokeCertificate(certId, reason, revokedBy) {
        return await createResource(`/certificates/${certId}/revoke`, { reason, revokedBy });
    },

    async getCertificateStats() {
        return await fetchResource('/admin/certificates/stats');
    }
};

export default CertificateService;
