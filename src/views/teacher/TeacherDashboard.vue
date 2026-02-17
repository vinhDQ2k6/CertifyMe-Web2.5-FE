<script setup>
import ClassTable from '@/components/teacher/ClassTable.vue';
import StatsCard from '@/components/shared/StatsCard.vue';
import { useTeacher } from '@/composables/useTeacher';
import { useAuth } from '@/composables/useAuth';
import { computed, onMounted } from 'vue';

const { user } = useAuth();
const { classes, loading, fetchClasses } = useTeacher();

const totalStudents = computed(() => classes.value.reduce((sum, c) => sum + (c.studentCount || 0), 0));
const totalQuizzes = computed(() => classes.value.reduce((sum, c) => sum + (c.quizCount || 0), 0));

onMounted(async () => {
    if (user.value?.id) {
        await fetchClasses(user.value.id);
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
                <Toolbar class="mb-4">
                    <template #start>
                        <h5 class="m-0">📚 Danh sách lớp học</h5>
                    </template>
                    <template #end>
                        <Button label="+ Tạo lớp" icon="pi pi-plus" />
                    </template>
                </Toolbar>
                <ClassTable :classes="classes" :loading="loading" />
            </div>
        </div>
    </div>
</template>
