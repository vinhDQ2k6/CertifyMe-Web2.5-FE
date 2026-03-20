<script setup>
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { useErrorHandler } from '@/composables/useErrorHandler';
import UserService from '@/services/UserService';
import { computed, onMounted, ref } from 'vue';

const { handleError, showSuccess } = useErrorHandler();

const users = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedRole = ref('');
const selectedStatus = ref('');
const confirmDialog = ref({ visible: false, userId: null, action: '', title: '', message: '', loading: false });

const filteredUsers = computed(() => {
    return users.value.filter((u) => {
        const matchSearch = !searchQuery.value || u.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchRole = !selectedRole.value || u.role === selectedRole.value;
        const matchStatus = selectedStatus.value === '' || (selectedStatus.value === 'active' ? u.isActive : !u.isActive);
        return matchSearch && matchRole && matchStatus;
    });
});

const stats = computed(() => ({
    total: users.value.length,
    admin: users.value.filter((u) => u.role === 'ADMIN').length,
    teacher: users.value.filter((u) => u.role === 'TEACHER').length,
    student: users.value.filter((u) => u.role === 'STUDENT').length,
    active: users.value.filter((u) => u.isActive).length
}));

onMounted(async () => {
    loading.value = true;
    try {
        const data = await UserService.getUsers();
        users.value = Array.isArray(data) ? data : data?.content || data?.data || [];
    } catch (err) {
        handleError(err, 'Tải danh sách người dùng');
    } finally {
        loading.value = false;
    }
});

function formatDate(dateStr) {
    if (!dateStr) return 'Chưa đăng nhập';
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

function openToggleStatus(user) {
    const isDeactivate = user.isActive;
    confirmDialog.value = {
        visible: true,
        userId: user.userId,
        action: 'toggleStatus',
        newStatus: !user.isActive,
        title: isDeactivate ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản',
        message: isDeactivate ? `Bạn có chắc muốn vô hiệu hóa tài khoản của "${user.fullName}"?` : `Bạn có chắc muốn kích hoạt tài khoản của "${user.fullName}"?`,
        confirmLabel: isDeactivate ? 'Vô hiệu hóa' : 'Kích hoạt',
        confirmSeverity: isDeactivate ? 'danger' : 'success',
        loading: false
    };
}

async function handleConfirm() {
    confirmDialog.value.loading = true;
    try {
        if (confirmDialog.value.action === 'toggleStatus') {
            await UserService.updateUserStatus(confirmDialog.value.userId, confirmDialog.value.newStatus);
            const user = users.value.find((u) => u.userId === confirmDialog.value.userId);
            if (user) user.isActive = confirmDialog.value.newStatus;
            showSuccess('Thành công', 'Đã cập nhật trạng thái tài khoản');
        }
    } catch (err) {
        handleError(err, 'Cập nhật tài khoản');
    } finally {
        confirmDialog.value.loading = false;
        confirmDialog.value.visible = false;
    }
}

async function changeRole(user, newRole) {
    try {
        await UserService.updateUserRole(user.userId, newRole);
        user.role = newRole;
        showSuccess('Thành công', `Đã đổi role thành ${newRole}`);
    } catch (err) {
        handleError(err, 'Đổi role');
    }
}

const roleOptions = [
    { label: 'Tất cả role', value: '' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Giáo viên', value: 'TEACHER' },
    { label: 'Sinh viên', value: 'STUDENT' }
];

const statusOptions = [
    { label: 'Tất cả', value: '' },
    { label: 'Đang hoạt động', value: 'active' },
    { label: 'Vô hiệu hóa', value: 'inactive' }
];

const availableRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Stats -->
        <div class="col-span-6 lg:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Tổng users</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.total }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border bg-blue-100 dark:bg-blue-400/10" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-blue-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">{{ stats.active }} đang hoạt động</span>
            </div>
        </div>
        <div class="col-span-6 lg:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Giáo viên</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.teacher }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border bg-orange-100 dark:bg-orange-400/10" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-user text-orange-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">{{ stats.admin }} admin</span>
            </div>
        </div>
        <div class="col-span-6 lg:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Sinh viên</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.student }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border bg-cyan-100 dark:bg-cyan-400/10" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-graduation-cap text-cyan-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">Đã đăng ký</span>
            </div>
        </div>
        <div class="col-span-6 lg:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Vô hiệu hóa</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.total - stats.active }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border bg-red-100 dark:bg-red-400/10" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-ban text-red-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">Tài khoản bị khóa</span>
            </div>
        </div>

        <!-- Filter & Table -->
        <div class="col-span-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template #start>
                        <h5 class="m-0">👥 QUẢN LÝ NGƯỜI DÙNG</h5>
                    </template>
                    <template #end>
                        <div class="flex flex-wrap items-center gap-2">
                            <IconField>
                                <InputIcon><i class="pi pi-search" /></InputIcon>
                                <InputText v-model="searchQuery" placeholder="Tìm theo tên, email..." />
                            </IconField>
                            <Select v-model="selectedRole" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Lọc role" class="w-36" />
                            <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Trạng thái" class="w-40" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable :value="filteredUsers" :loading="loading" stripedRows :paginator="filteredUsers.length > 10" :rows="10">
                    <Column field="fullName" header="Tên người dùng" sortable style="min-width: 14rem">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                    {{ slotProps.data.fullName[0] }}
                                </div>
                                <div>
                                    <div class="font-medium">{{ slotProps.data.fullName }}</div>
                                    <div class="text-muted-color text-xs">{{ slotProps.data.email }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column header="Role" style="min-width: 10rem">
                        <template #body="slotProps">
                            <Select :modelValue="slotProps.data.role" :options="availableRoles" size="small" @update:modelValue="changeRole(slotProps.data, $event)" />
                        </template>
                    </Column>
                    <Column header="Trạng thái" style="min-width: 9rem">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.isActive ? '🟢 Hoạt động' : '🔴 Khóa'" :severity="slotProps.data.isActive ? 'success' : 'danger'" />
                        </template>
                    </Column>
                    <Column header="Đăng nhập gần nhất" sortable style="min-width: 10rem">
                        <template #body="slotProps">
                            <span class="text-sm">{{ formatDate(slotProps.data.lastLoginAt) }}</span>
                        </template>
                    </Column>
                    <Column header="Hành động" style="min-width: 8rem">
                        <template #body="slotProps">
                            <Button
                                :icon="slotProps.data.isActive ? 'pi pi-ban' : 'pi pi-check'"
                                :severity="slotProps.data.isActive ? 'danger' : 'success'"
                                outlined
                                rounded
                                size="small"
                                :tooltip="slotProps.data.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'"
                                @click="openToggleStatus(slotProps.data)"
                            />
                        </template>
                    </Column>
                </DataTable>

                <div v-if="!loading && filteredUsers.length === 0" class="text-center text-muted-color py-8">Không tìm thấy người dùng nào</div>
            </div>
        </div>

        <!-- Confirm Modal -->
        <ConfirmModal
            v-model:visible="confirmDialog.visible"
            :title="confirmDialog.title"
            :message="confirmDialog.message"
            :confirmLabel="confirmDialog.confirmLabel"
            :confirmSeverity="confirmDialog.confirmSeverity"
            :loading="confirmDialog.loading"
            @confirm="handleConfirm"
        />
    </div>
</template>
