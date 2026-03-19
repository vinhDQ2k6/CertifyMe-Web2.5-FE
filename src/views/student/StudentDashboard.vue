<script setup>
import CourseCard from '@/components/student/CourseCard.vue';
import StatsCard from '@/components/shared/StatsCard.vue';
import { useStudent } from '@/composables/useStudent';
import { useAuth } from '@/composables/useAuth';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const { user } = useAuth();
const router = useRouter();
const { courses, inProgressCourses, completedCourses, loading, fetchCourses } = useStudent();

// Mock data for FE-only testing (remove when integrating with BE)
const mockCourses = [
    {
        courseId: 'c1',
        courseIcon: '☕',
        courseName: 'Lập trình Java 6',
        courseCode: 'SD18301',
        teacherName: 'Thầy Nguyễn Văn A',
        progress: 80,
        totalQuizzes: 5,
        completedQuizzes: 4,
        isCompleted: false,
        averageScore: 8.5
    },
    {
        courseId: 'c2',
        courseIcon: '⚛️',
        courseName: 'Lập trình React 3',
        courseCode: 'SD18302',
        teacherName: 'Cô Trần Thị B',
        progress: 60,
        totalQuizzes: 5,
        completedQuizzes: 3,
        isCompleted: false,
        averageScore: 7.8
    },
    {
        courseId: 'c3',
        courseIcon: '🌐',
        courseName: 'Phát triển Web 5',
        courseCode: 'SD18201',
        teacherName: 'Thầy Lê Văn C',
        progress: 40,
        totalQuizzes: 5,
        completedQuizzes: 2,
        isCompleted: false,
        averageScore: 7.0
    },
    {
        courseId: 'c4',
        courseIcon: '🐍',
        courseName: 'Lập trình Python',
        courseCode: 'SD18101',
        teacherName: 'Cô Phạm Thị D',
        progress: 100,
        totalQuizzes: 5,
        completedQuizzes: 5,
        isCompleted: true,
        averageScore: 9.2
    },
    {
        courseId: 'c5',
        courseIcon: '🗄️',
        courseName: 'Cơ sở dữ liệu',
        courseCode: 'SD18102',
        teacherName: 'Thầy Hoàng Văn E',
        progress: 100,
        totalQuizzes: 4,
        completedQuizzes: 4,
        isCompleted: true,
        averageScore: 8.8
    }
];

onMounted(async () => {
    if (user.value?.id) {
        await fetchCourses(user.value.id);
    }
    // Use mock data if no courses loaded from API
    if (courses.value.length === 0) {
        courses.value = mockCourses;
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
