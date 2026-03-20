<script setup>
import { useAuth } from '@/composables/useAuth';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { setToken, setRole } = useAuth();

onMounted(() => {
    // Read params from URL (sent by backend)
    const token = route.query.token;
    const role = route.query.role;
    const redirect = route.query.redirect;
    const error = route.query.error;

    // Handle OAuth error
    if (error) {
        console.error('OAuth error:', error);
        router.push('/auth/login?error=' + error);
        return;
    }

    // Handle successful login
    if (token && role && redirect) {
        // Save token and role
        setToken(token);
        setRole(role);

        // Clean URL history (remove ?token=...)
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect to path from backend
        router.push(redirect);
    } else {
        // Fallback if missing params
        router.push('/auth/login?error=missing_params');
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
