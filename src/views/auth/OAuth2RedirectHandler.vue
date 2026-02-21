<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import AuthService from '@/services/AuthService';

const router = useRouter();
const { handleOAuth2Callback } = useAuth();

onMounted(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const token = urlParams.get('token');

    if (error) {
        console.error('OAuth2 error:', error);
        router.push({ name: 'login' });
        return;
    }

    if (!token) {
        console.error('No token in OAuth2 redirect URL');
        router.push({ name: 'login' });
        return;
    }

    try {
        const userInfo = handleOAuth2Callback(token);

        const roleRedirects = {
            STUDENT: { name: 'studentDashboard' },
            TEACHER: { name: 'teacherDashboard' },
            ADMIN: { name: 'adminDashboard' }
        };

        const redirectRoute = roleRedirects[userInfo.role];

        if (!redirectRoute) {
            console.error('Unknown role:', userInfo.role);
            AuthService.clearAuthData();
            router.push({ name: 'login' });
            return;
        }

        // Clean URL history (remove ?token=...)
        window.history.replaceState({}, document.title, window.location.pathname);

        router.push(redirectRoute);
    } catch (err) {
        console.error('OAuth2 callback error:', err);
        router.push({ name: 'login' });
    }
});
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950" role="status" aria-live="polite">
        <div class="text-center">
            <div class="flex justify-center mb-4">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900">
                    <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
                </div>
            </div>
            <h2 class="text-2xl font-semibold mb-2">Đang xử lý đăng nhập...</h2>
            <p class="text-muted-color">Vui lòng chờ trong giây lát</p>
        </div>
    </div>
</template>
