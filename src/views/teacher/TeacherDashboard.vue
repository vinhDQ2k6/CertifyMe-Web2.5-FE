<script setup>
import StatsCard from '@/components/shared/StatsCard.vue';
import ClassTable from '@/components/teacher/ClassTable.vue';
import { useAuth } from '@/composables/useAuth';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useTeacher } from '@/composables/useTeacher';
import { computed, onMounted } from 'vue';

const { user } = useAuth();
const { classes, loading, fetchClasses } = useTeacher();
const { handleError } = useErrorHandler();

const totalStudents = computed(() => classes.value.reduce((sum, c) => sum + (c.studentCount || 0), 0));
const totalQuizzes = computed(() => classes.value.reduce((sum, c) => sum + (c.quizCount || 0), 0));

onMounted(async () => {
    try {
        await fetchClasses(user.value?.userId);
    } catch (err) {
        handleError(err, 'Tải danh sách lớp học');
    }
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Section -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <StatsCard title="Lớp học" :value="classes.length" icon="pi pi-book" iconBgColor="blue" subtitle="Tổng số lớp" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <StatsCard title="Sinh viên" :value="totalStudents" icon="pi pi-users" iconBgColor="cyan" subtitle="Tổng số sinh viên" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <StatsCard title="Quiz" :value="totalQuizzes" icon="pi pi-file" iconBgColor="purple" subtitle="Tổng số quiz" />
        </div>

        <!-- Classes Table -->
        <div class="col-span-12">
            <div class="card">
                <h5 class="mb-4">📚 Danh sách lớp học</h5>
                <ClassTable :classes="classes" :loading="loading" />
            </div>
        </div>
    </div>
</template>
