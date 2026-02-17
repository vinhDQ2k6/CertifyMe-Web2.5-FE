import AuthService from '@/services/AuthService';
import { ref } from 'vue';

const user = ref(null);
const isAuthenticated = ref(false);
const userRole = ref(null);
const loading = ref(false);

export function useAuth() {
    const initAuth = () => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && AuthService.getAuthToken()) {
            user.value = currentUser;
            isAuthenticated.value = true;
            userRole.value = currentUser.role || null;
        }
    };

    const login = async (credential) => {
        loading.value = true;
        try {
            const data = await AuthService.signInWithGoogle(credential);
            user.value = data.user;
            isAuthenticated.value = true;
            userRole.value = data.user?.role || null;
            return data;
        } finally {
            loading.value = false;
        }
    };

    const logout = () => {
        AuthService.logout();
        user.value = null;
        isAuthenticated.value = false;
        userRole.value = null;
    };

    const getCurrentUser = () => {
        return user.value;
    };

    const hasRole = (role) => {
        return userRole.value === role;
    };

    // Initialize auth state on first use
    if (!user.value) {
        initAuth();
    }

    return {
        user,
        isAuthenticated,
        userRole,
        loading,
        login,
        logout,
        getCurrentUser,
        hasRole
    };
}
