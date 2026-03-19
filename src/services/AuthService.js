import axiosInstance from '@/lib/apiFetcher/axiosInstance';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

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
     * Clear auth data from localStorage and axios headers
     */
    clearAuthData() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
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
        try {
            const response = await axiosInstance.get('/auth/me');

            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.error || 'Failed to fetch user');
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    },

    /**
     * Check role of current user via /api/auth/check-role
     * Returns message like "You are logged in as: STUDENT"
     */
    async checkRole() {
        try {
            const response = await axiosInstance.get('/auth/check-role');
            return response.data;
        } catch (error) {
            console.error('Check role error:', error);
            throw error;
        }
    },

    /**
     * Logout - call backend endpoint + clear auth data
     */
    async logout() {
        try {
            const response = await axiosInstance.post('/auth/logout');
            if (response.data.success) {
                console.log(response.data.message);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuthData();
        }
    }
};

export default AuthService;
