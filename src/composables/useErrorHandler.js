import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';

export function useErrorHandler() {
    const error = ref(null);
    const toast = useToast();

    function handleError(err, context = '') {
        let message = 'Đã xảy ra lỗi không xác định';

        // Resolve status from either ApiError (err.statusCode) or raw Axios error (err.response.status)
        const status = err?.statusCode ?? err?.response?.status;
        const data = err?.response?.data;

        if (status === 400) {
            message = data?.message || err?.message || 'Dữ liệu không hợp lệ';
        } else if (status === 401) {
            message = 'Phiên đăng nhập đã hết hạn';
        } else if (status === 403) {
            message = 'Bạn không có quyền thực hiện thao tác này';
        } else if (status === 404) {
            message = data?.message || err?.message || 'Không tìm thấy dữ liệu';
        } else if (status === 409) {
            message = data?.message || err?.message || 'Dữ liệu đã tồn tại';
        } else if (status >= 500) {
            message = 'Lỗi máy chủ, vui lòng thử lại sau';
        } else if (err?.message) {
            message = err.message;
        }

        error.value = message;

        toast.add({
            severity: 'error',
            summary: context ? `Lỗi: ${context}` : 'Lỗi',
            detail: message,
            life: 5000
        });

        return message;
    }

    function clearError() {
        error.value = null;
    }

    function showSuccess(summary, detail = '', life = 3000) {
        toast.add({ severity: 'success', summary, detail, life });
    }

    function showInfo(summary, detail = '', life = 3000) {
        toast.add({ severity: 'info', summary, detail, life });
    }

    function showWarn(summary, detail = '', life = 4000) {
        toast.add({ severity: 'warn', summary, detail, life });
    }

    return {
        error,
        handleError,
        clearError,
        showSuccess,
        showInfo,
        showWarn
    };
}
