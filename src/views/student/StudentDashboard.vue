<script setup>
import StatsCard from '@/components/shared/StatsCard.vue';
import CourseCard from '@/components/student/CourseCard.vue';
import { useAuth } from '@/composables/useAuth';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useStudent } from '@/composables/useStudent';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const { user } = useAuth();
const router = useRouter();
const { inProgressCourses, completedCourses, loading, fetchCourses } = useStudent();
const { handleError } = useErrorHandler();

onMounted(async () => {
    try {
        await fetchCourses(user.value?.userId);
    } catch (err) {
        handleError(err, 'Tải danh sách khóa học');
    }
});

const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
};
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Section -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3 cursor-pointer hover:shadow-lg transition-shadow rounded-xl" @click="scrollToSection('in-progress-section')">
            <StatsCard title="Đang học" :value="inProgressCourses.length" icon="pi pi-book" iconBgColor="blue" subtitle="Khóa học đang tiến hành" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3 cursor-pointer hover:shadow-lg transition-shadow rounded-xl" @click="scrollToSection('completed-section')">
            <StatsCard title="Hoàn thành" :value="completedCourses.length" icon="pi pi-check-circle" iconBgColor="green" subtitle="Khóa học đã hoàn thành" />
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 cursor-pointer hover:shadow-lg transition-shadow" @click="router.push({ name: 'studentCertificates' })">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Chứng chỉ</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ completedCourses.length }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border bg-purple-100 dark:bg-purple-400/10" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-id-card text-purple-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary text-sm font-medium cursor-pointer">Xem tất cả →</span>
            </div>
        </div>

        <!-- In Progress Courses -->
        <div id="in-progress-section" class="col-span-12 scroll-mt-6">
            <div class="card">
                <h5 class="mb-4">📚 Khóa học đang học</h5>
                <div v-if="loading" class="text-center py-8">
                    <ProgressSpinner />
                </div>
                <div v-else-if="inProgressCourses.length === 0" class="text-center text-muted-color py-8">Không có khóa học đang học</div>
                <div v-else class="grid grid-cols-12 gap-4">
                    <div v-for="course in inProgressCourses" :key="course.courseId || course.classId || course.id" class="col-span-12 md:col-span-6 xl:col-span-4">
                        <CourseCard v-bind="course" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Completed Courses -->
        <div id="completed-section" class="col-span-12 scroll-mt-6">
            <div class="card">
                <h5 class="mb-4">✅ Khóa học đã hoàn thành</h5>
                <div v-if="completedCourses.length === 0" class="text-center text-muted-color py-8">Chưa hoàn thành khóa học nào</div>
                <div v-else class="grid grid-cols-12 gap-4">
                    <div v-for="course in completedCourses" :key="course.courseId || course.classId || course.id" class="col-span-12 md:col-span-6">
                        <CourseCard v-bind="course" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
