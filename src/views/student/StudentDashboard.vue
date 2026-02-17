<script setup>
import CourseCard from '@/components/student/CourseCard.vue';
import StatsCard from '@/components/shared/StatsCard.vue';
import { useStudent } from '@/composables/useStudent';
import { useAuth } from '@/composables/useAuth';
import { onMounted } from 'vue';

const { user } = useAuth();
const { inProgressCourses, completedCourses, loading, fetchCourses } = useStudent();

onMounted(async () => {
    if (user.value?.id) {
        await fetchCourses(user.value.id);
    }
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Section -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <StatsCard title="Đang học" :value="inProgressCourses.length" icon="pi pi-book" iconBgColor="blue" subtitle="Khóa học đang tiến hành" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <StatsCard title="Hoàn thành" :value="completedCourses.length" icon="pi pi-check-circle" iconBgColor="green" subtitle="Khóa học đã hoàn thành" />
        </div>

        <!-- In Progress Courses -->
        <div class="col-span-12">
            <div class="card">
                <h5 class="mb-4">📚 Khóa học đang học</h5>
                <div v-if="loading" class="text-center py-8">
                    <ProgressSpinner />
                </div>
                <div v-else-if="inProgressCourses.length === 0" class="text-center text-muted-color py-8">Không có khóa học đang học</div>
                <div v-else class="grid grid-cols-12 gap-4">
                    <div v-for="course in inProgressCourses" :key="course.courseId" class="col-span-12 md:col-span-6 xl:col-span-4">
                        <CourseCard v-bind="course" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Completed Courses -->
        <div class="col-span-12">
            <div class="card">
                <h5 class="mb-4">✅ Khóa học đã hoàn thành</h5>
                <div v-if="completedCourses.length === 0" class="text-center text-muted-color py-8">Chưa hoàn thành khóa học nào</div>
                <div v-else class="grid grid-cols-12 gap-4">
                    <div v-for="course in completedCourses" :key="course.courseId" class="col-span-12 md:col-span-6">
                        <CourseCard v-bind="course" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
