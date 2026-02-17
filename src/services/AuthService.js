import { fetchResource, createResource } from '@/lib/apiFetcher';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

const AuthService = {
    initializeGoogleAuth() {
        // Setup Google OAuth - placeholder for Google Identity Services initialization
    },

    async signInWithGoogle(credential) {
        const data = await createResource('/auth/google', { credential });
        if (data.token) {
            this.setAuthToken(data.token);
        }
        if (data.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return data;
    },

    getAuthToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    setAuthToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    getCurrentUser() {
        const userJson = localStorage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    getUserRole() {
        const user = this.getCurrentUser();
        return user?.role || null;
    },

    async refreshToken() {
        const data = await fetchResource('/auth/refresh');
        if (data.token) {
            this.setAuthToken(data.token);
        }
        return data;
    }
};

export default AuthService;
