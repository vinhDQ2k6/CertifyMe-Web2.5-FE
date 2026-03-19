<script setup>
import QuizForm from '@/components/teacher/QuizForm.vue';
import { useTeacher } from '@/composables/useTeacher';
import QuizService from '@/services/QuizService';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { quizzes, loading, fetchQuizzes } = useTeacher();

const showForm = ref(false);
const editingQuiz = ref(null);

// Mock data for FE-only testing (remove when integrating with BE)
const mockQuizzes = [
    { id: 'q1', name: 'Lab 1: Biến và kiểu dữ liệu', questionsCount: 10, passingScore: 5.0, status: 'published' },
    { id: 'q2', name: 'Lab 2: Vòng lặp và mảng', questionsCount: 10, passingScore: 5.0, status: 'published' },
    { id: 'q3', name: 'Lab 3: OOP cơ bản', questionsCount: 10, passingScore: 5.0, status: 'published' },
    { id: 'q4', name: 'Lab 4: Kế thừa và đa hình', questionsCount: 10, passingScore: 5.0, status: 'published' },
    { id: 'q5', name: 'Lab 5: Collections Framework', questionsCount: 8, passingScore: 5.0, status: 'draft' }
];

onMounted(async () => {
    try {
        await fetchQuizzes(route.params.classId);
    } catch {
        // ignore API errors in FE-only mode
    }
    // Use mock data if no quizzes loaded from API
    if (quizzes.value.length === 0) {
        quizzes.value = mockQuizzes;
    }
});

function goBack() {
    router.push({ name: 'classDetail', params: { id: route.params.classId } });
}

function viewSubmissions() {
    router.push({ name: 'quizSubmissions', params: { classId: route.params.classId } });
}

function getStatusSeverity(status) {
    return status === 'published' ? 'success' : 'warn';
}

function getStatusLabel(status) {
    return status === 'published' ? '🟢 Published' : '📝 Draft';
}

function openNewQuiz() {
    editingQuiz.value = null;
    showForm.value = true;
}

function editQuiz(quiz) {
    editingQuiz.value = quiz;
    showForm.value = true;
}

async function handleDelete(quizId) {
    try {
        await QuizService.deleteQuiz(quizId);
        quizzes.value = quizzes.value.filter((q) => q.id !== quizId);
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa quiz', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa quiz', life: 3000 });
    }
}

async function handleSave({ data, action }) {
    try {
        if (editingQuiz.value) {
            await QuizService.updateQuiz(editingQuiz.value.id, data);
            if (action === 'publish') {
                await QuizService.publishQuiz(editingQuiz.value.id);
            }
        } else {
            const quiz = await QuizService.createQuiz(route.params.classId, data);
            if (action === 'publish') {
                await QuizService.publishQuiz(quiz.id);
            }
        }
        showForm.value = false;
        await fetchQuizzes(route.params.classId);
        toast.add({ severity: 'success', summary: 'Thành công', detail: action === 'publish' ? 'Quiz đã được publish' : 'Quiz đã được lưu', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể lưu quiz', life: 3000 });
    }
}
</script>

<template>
    <div>
        <!-- Header -->
        <Button label="← Quay lại lớp" text class="mb-4" @click="goBack" />

        <!-- Quiz List -->
        <div class="card mb-4">
            <Toolbar class="mb-4">
                <template #start>
                    <h5 class="m-0">📝 QUẢN LÝ QUIZ</h5>
                </template>
                <template #end>
                    <div class="flex gap-2">
                        <Button label="Bài nộp" icon="pi pi-list" severity="secondary" outlined @click="viewSubmissions" />
                        <Button label="+ Tạo Quiz" icon="pi pi-plus" @click="openNewQuiz" />
                    </div>
                </template>
            </Toolbar>

            <DataTable :value="quizzes" :loading="loading" stripedRows>
                <Column field="name" header="Tên quiz" sortable style="min-width: 14rem"></Column>
                <Column header="Số câu hỏi" style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps.data.questionsCount || 0 }}
                    </template>
                </Column>
                <Column header="Điểm qua" style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps.data.passingScore || 0 }}
                    </template>
                </Column>
                <Column header="Trạng thái" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column header="Hành động" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" size="small" @click="editQuiz(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="handleDelete(slotProps.data.id)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Quiz Form -->
        <div v-if="showForm">
            <QuizForm :quizId="editingQuiz?.id || null" :classId="route.params.classId" :initialData="editingQuiz" @save="handleSave" @close="showForm = false" />
        </div>
    </div>
</template>
