<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import AuthService from '@/services/AuthService';

const router = useRouter();
const { handleOAuth2Callback } = useAuth();

onMounted(async () => {
    try {
        // Step 1: Extract token from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        // Check for errors from backend
        if (error) {
            console.error('OAuth2 error from backend:', error);
            router.push({ name: 'login' });
            return;
        }

        // Check if token exists
        if (!token) {
            console.error('No token in OAuth2 redirect URL');
            router.push({ name: 'login' });
            return;
        }

        // Step 2: Process token via useAuth
        const userInfo = handleOAuth2Callback(token);

        // Step 3: Frontend decides redirect by role
        const roleRedirects = {
            STUDENT: { name: 'studentDashboard' },
            TEACHER: { name: 'teacherDashboard' },
            ADMIN: { name: 'adminDashboard' }
        };

        const redirectRoute = roleRedirects[userInfo.role];

        if (!redirectRoute) {
            console.error('Unknown user role:', userInfo.role);
            AuthService.clearAuthData();
            router.push({ name: 'login' });
            return;
        }

        // Step 4: Clean URL history (remove ?token=...)
        window.history.replaceState({}, document.title, window.location.pathname);

        // Step 5: Navigate to role-specific dashboard
        router.push(redirectRoute);
    } catch (error) {
        console.error('OAuth2 callback error:', error);
        router.push({ name: 'login' });
    }
});
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <div class="text-center">
            <!-- Loading spinner -->
            <div class="flex justify-center mb-4">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900">
                    <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
                </div>
            </div>

            <!-- Loading text -->
            <h2 class="text-2xl font-semibold mb-2 text-surface-900 dark:text-surface-0">Đang xử lý đăng nhập...</h2>
            <p class="text-muted-color">Vui lòng chờ trong giây lát</p>
        </div>
    </div>
</template>

<style scoped>
.pi-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
