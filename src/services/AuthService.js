import axiosInstance from '@/lib/apiFetcher/axiosInstance';
import { createResource, fetchResource } from '@/lib/apiFetcher';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const ROLE_KEY = 'authRole';

const AuthService = {
    /**
     * Set JWT token - save to localStorage + set axios header
     * Called from OAuth2RedirectHandler after backend redirects
     */
    setAuthToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    /**
     * Get JWT token from localStorage
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Set user role - save to localStorage
     * @param {string} role - STUDENT, TEACHER, or ADMIN
     */
    setRole(role) {
        localStorage.setItem(ROLE_KEY, role);
    },

    /**
     * Get user role from localStorage
     */
    getRole() {
        return localStorage.getItem(ROLE_KEY);
    },

    /**
     * Clear auth data from localStorage and axios headers
     */
    clearAuthData() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ROLE_KEY);
        delete axiosInstance.defaults.headers.common['Authorization'];
    },

    /**
     * Decode JWT token to extract user info (userId, email, role)
     * Note: Do NOT validate signature on client side
     * Backend will verify when using token
     */
    getUserFromToken() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                userId: payload.sub,
                email: payload.email,
                role: payload.role
            };
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    },

    /**
     * Check if token is valid and not expired
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        } catch {
            return false;
        }
    },

    /**
     * Fetch current user info from /api/auth/me
     * Returns UserResponse from backend
     */
    async getCurrentUser() {
        return await fetchResource('/auth/me');
    },

    /**
     * Check role of current user via /api/auth/check-role
     * Returns success message
     */
    async checkRole() {
        return await fetchResource('/auth/check-role');
    },

    /**
     * Logout - call backend endpoint (POST) + clear auth data
     * API: POST /api/auth/logout
     */
    async logout() {
        try {
            await createResource('/auth/logout', {});
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuthData();
        }
    }
};

export default AuthService;
