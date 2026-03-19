<script setup>
import StudentTable from '@/components/teacher/StudentTable.vue';
import QuizList from '@/components/student/QuizList.vue';
import { useTeacher } from '@/composables/useTeacher';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';

const route = useRoute();
const router = useRouter();
const { currentClass, students, quizzes, loading, fetchClassDetail, fetchStudents, fetchQuizzes } = useTeacher();
const { handleError } = useErrorHandler();
const activeTab = ref(0);

onMounted(async () => {
    const classId = route.params.id;
    try {
        await fetchClassDetail(classId);
        await fetchStudents(classId);
        if (currentClass.value?.courseId) {
            await fetchQuizzes(currentClass.value.courseId);
        }
    } catch (err) {
        handleError(err, 'Tải thông tin lớp học');
    }
});

function goBack() {
    router.push({ name: 'teacherDashboard' });
}

function goToQuizManagement() {
    router.push({ name: 'quizManagement', params: { classId: route.params.id } });
}
</script>

<template>
    <div>
        <!-- Header -->
        <div class="flex items-center gap-4 mb-4">
            <Button label="← Quay lại" text @click="goBack" />
            <h3 v-if="currentClass" class="m-0">📚 Lớp {{ currentClass.code }} - {{ currentClass.courseName }}</h3>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else class="grid grid-cols-12 gap-4">
            <!-- Side Menu -->
            <div class="col-span-12 md:col-span-3">
                <div class="card">
                    <div class="flex flex-col gap-2">
                        <Button label="👥 Sinh viên" :text="activeTab !== 0" :severity="activeTab === 0 ? undefined : 'secondary'" class="w-full justify-start" @click="activeTab = 0" />
                        <Button label="📝 Quiz" :text="activeTab !== 1" :severity="activeTab === 1 ? undefined : 'secondary'" class="w-full justify-start" @click="activeTab = 1" />
                        <Button label="📊 Thống kê" :text="activeTab !== 2" :severity="activeTab === 2 ? undefined : 'secondary'" class="w-full justify-start" @click="activeTab = 2" />
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="col-span-12 md:col-span-9">
                <div class="card">
                    <!-- Tab: Students -->
                    <div v-if="activeTab === 0">
                        <div class="flex justify-between items-center mb-4">
                            <h5 class="m-0">DANH SÁCH SINH VIÊN ({{ students.length }})</h5>
                            <Button label="+ Thêm SV" icon="pi pi-plus" size="small" />
                        </div>
                        <StudentTable :students="students" :classId="route.params.id" :loading="loading" />
                    </div>

                    <!-- Tab: Quizzes -->
                    <div v-if="activeTab === 1">
                        <div class="flex justify-between items-center mb-4">
                            <h5 class="m-0">DANH SÁCH QUIZ</h5>
                            <Button label="Quản lý Quiz" icon="pi pi-external-link" size="small" @click="goToQuizManagement" />
                        </div>
                        <QuizList :quizzes="quizzes" :isCompleted="false" />
                    </div>

                    <!-- Tab: Statistics -->
                    <div v-if="activeTab === 2">
                        <h5 class="mb-4">📊 Thống kê lớp học</h5>
                        <div class="text-center text-muted-color py-8">Chức năng thống kê đang được phát triển...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
