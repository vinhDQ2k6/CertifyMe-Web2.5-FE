import { fetchResource, updateResource, deleteResource } from '@/lib/apiFetcher';

const UserService = {
    async getUsers(params = {}) {
        return await fetchResource('/admin/users', { params });
    },

    async getUserDetail(userId) {
        return await fetchResource(`/admin/users/${userId}`);
    },

    async updateUserRole(userId, role) {
        return await updateResource(`/admin/users/${userId}/role`, { role });
    },

    async updateUserStatus(userId, isActive) {
        return await updateResource(`/admin/users/${userId}/status`, { isActive });
    },

    async deleteUser(userId) {
        return await deleteResource(`/admin/users/${userId}`);
    }
};

export default UserService;
