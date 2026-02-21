import AuthService from '@/services/AuthService';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// Module-level reactive state (shared across all components using useAuth)
const user = ref(null);
const isAuthenticated = ref(false);
const userRole = ref(null);
const loading = ref(false);
const error = ref('');

export function useAuth() {
    const router = useRouter();

    /**
     * Initialize auth state from stored token
     * Called on app startup to restore user session
     */
    const initAuth = () => {
        const token = AuthService.getToken();

        if (token && AuthService.isAuthenticated()) {
            const userInfo = AuthService.getUserFromToken();
            if (userInfo) {
                user.value = userInfo;
                isAuthenticated.value = true;
                userRole.value = userInfo.role;
            }
        } else {
            isAuthenticated.value = false;
            user.value = null;
            userRole.value = null;
        }
    };

    /**
     * Redirect to Google OAuth2 login page on backend
     * Backend handles all OAuth2 flow
     */
    const redirectToLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    /**
     * Handle OAuth2 callback after backend redirects with token
     * Called from OAuth2RedirectHandler component
     * @param {string} token - JWT token from URL query parameter
     */
    const handleOAuth2Callback = (token) => {
        try {
            if (!token) {
                throw new Error('No token received');
            }

            AuthService.setAuthToken(token);

            const userInfo = AuthService.getUserFromToken();
            if (!userInfo) {
                throw new Error('Invalid token - cannot decode user info');
            }

            user.value = userInfo;
            isAuthenticated.value = true;
            userRole.value = userInfo.role;
            error.value = '';

            return userInfo;
        } catch (err) {
            console.error('OAuth2 callback error:', err);
            error.value = err.message;
            isAuthenticated.value = false;
            user.value = null;
            userRole.value = null;
            throw err;
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            loading.value = true;
            await AuthService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            user.value = null;
            isAuthenticated.value = false;
            userRole.value = null;
            loading.value = false;

            router.push({ name: 'login' });
        }
    };

    /**
     * Check if current user has a specific role
     * @param {string} role - UPPERCASE role name: 'STUDENT', 'TEACHER', 'ADMIN'
     * @returns {boolean}
     */
    const hasRole = (role) => {
        return userRole.value === role;
    };

    /**
     * Get current user info
     */
    const getCurrentUser = () => {
        return user.value;
    };

    // Initialize auth state on first composable use
    if (!user.value && !isAuthenticated.value) {
        initAuth();
    }

    return {
        // State
        user,
        isAuthenticated,
        userRole,
        loading,
        error,

        // Methods
        initAuth,
        redirectToLogin,
        handleOAuth2Callback,
        logout,
        hasRole,
        getCurrentUser,

        // Computed (optional for convenience)
        userEmail: computed(() => user.value?.email),
        userId: computed(() => user.value?.userId)
    };
}
