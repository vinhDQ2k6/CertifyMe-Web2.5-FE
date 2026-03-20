<script setup>
import { useTeacher } from '@/composables/useTeacher';
import { useErrorHandler } from '@/composables/useErrorHandler';
import QuizService from '@/services/QuizService';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed } from 'vue';

const route = useRoute();
const router = useRouter();
const { quizzes, loading } = useTeacher();
const { handleError, showSuccess } = useErrorHandler();

const submissions = ref([]);
const loadingSubmissions = ref(false);
const selectedQuiz = ref(null);
const searchQuery = ref('');

const filteredSubmissions = computed(() => {
    if (!searchQuery.value.trim()) return submissions.value;
    const q = searchQuery.value.toLowerCase();
    return submissions.value.filter((s) => s.studentName.toLowerCase().includes(q) || s.studentEmail.toLowerCase().includes(q));
});

const passedCount = computed(() => submissions.value.filter((s) => s.passed).length);
const failedCount = computed(() => submissions.value.filter((s) => !s.passed).length);
const avgScore = computed(() => {
    if (!submissions.value.length) return 0;
    const sum = submissions.value.reduce((acc, s) => acc + s.score, 0);
    return Math.round((sum / submissions.value.length) * 10) / 10;
});

onMounted(async () => {
    try {
        quizzes.value = await QuizService.getQuizzesForClass(route.params.classId);
    } catch (err) {
        handleError(err, 'Tải danh sách quiz');
    }
});

async function loadSubmissions(quiz) {
    selectedQuiz.value = quiz;
    loadingSubmissions.value = true;
    try {
        submissions.value = await QuizService.getQuizSubmissions(quiz.id);
    } catch (err) {
        handleError(err, 'Tải bài nộp');
        submissions.value = [];
    } finally {
        loadingSubmissions.value = false;
    }
}

function goBack() {
    router.push({ name: 'quizManagement', params: { classId: route.params.classId } });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN');
}

function exportCSV() {
    if (!submissions.value.length) return;
    const headers = ['Họ tên', 'Email', 'Điểm', 'Kết quả', 'Ngày nộp'];
    const rows = submissions.value.map((s) => [s.studentName, s.studentEmail, s.score, s.passed ? 'ĐẠT' : 'KHÔNG ĐẠT', formatDate(s.submittedAt)]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${selectedQuiz.value?.id || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Xuất file thành công', 'Đã tải xuống file CSV');
}
</script>

<template>
    <div>
        <Button label="← Quay lại" text class="mb-4" @click="goBack" />

        <div class="grid grid-cols-12 gap-4">
            <!-- Quiz List Panel -->
            <div class="col-span-12 md:col-span-4">
                <div class="card">
                    <h5 class="font-semibold mb-4">📝 Danh sách Quiz</h5>
                    <div v-if="loading" class="text-center py-4">
                        <ProgressSpinner style="width: 2rem; height: 2rem" />
                    </div>
                    <div v-else class="flex flex-col gap-2">
                        <div
                            v-for="quiz in quizzes"
                            :key="quiz.id"
                            :class="['p-3 rounded-lg border-2 cursor-pointer transition-all', selectedQuiz?.id === quiz.id ? 'border-primary bg-primary/10 dark:bg-primary/20' : 'border-surface-200 dark:border-surface-600 hover:border-primary/50']"
                            @click="loadSubmissions(quiz)"
                        >
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ quiz.quizName }}</div>
                            <div class="flex items-center gap-2 mt-1">
                                <Tag :value="quiz.status === 'active' ? '🟢 Active' : '📝 Draft'" :severity="quiz.status === 'active' ? 'success' : 'warn'" />
                                <span class="text-muted-color text-xs">{{ quiz.questionCount }} câu</span>
                            </div>
                        </div>
                        <div v-if="quizzes.length === 0" class="text-center text-muted-color py-4">Không có quiz nào</div>
                    </div>
                </div>
            </div>

            <!-- Submissions Panel -->
            <div class="col-span-12 md:col-span-8">
                <div v-if="!selectedQuiz" class="card text-center py-12">
                    <div class="text-4xl mb-3">👈</div>
                    <p class="text-muted-color">Chọn một quiz để xem bài nộp</p>
                </div>

                <div v-else>
                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="card mb-0 text-center">
                            <div class="text-2xl font-bold text-primary">{{ submissions.length }}</div>
                            <div class="text-muted-color text-sm">Tổng nộp</div>
                        </div>
                        <div class="card mb-0 text-center">
                            <div class="text-2xl font-bold text-green-500">{{ passedCount }}</div>
                            <div class="text-muted-color text-sm">Đạt</div>
                        </div>
                        <div class="card mb-0 text-center">
                            <div class="text-2xl font-bold text-red-500">{{ failedCount }}</div>
                            <div class="text-muted-color text-sm">Không đạt</div>
                        </div>
                    </div>

                    <!-- Submissions Table -->
                    <div class="card">
                        <Toolbar class="mb-4">
                            <template #start>
                                <h5 class="m-0">📋 Bài nộp - {{ selectedQuiz.quizName }}</h5>
                            </template>
                            <template #end>
                                <div class="flex items-center gap-2">
                                    <IconField>
                                        <InputIcon><i class="pi pi-search" /></InputIcon>
                                        <InputText v-model="searchQuery" placeholder="Tìm sinh viên..." size="small" />
                                    </IconField>
                                    <Button icon="pi pi-download" outlined size="small" label="Xuất CSV" @click="exportCSV" :disabled="!submissions.length" />
                                </div>
                            </template>
                        </Toolbar>

                        <div v-if="loadingSubmissions" class="text-center py-8">
                            <ProgressSpinner />
                        </div>
                        <DataTable v-else :value="filteredSubmissions" stripedRows :paginator="filteredSubmissions.length > 10" :rows="10">
                            <Column field="studentName" header="Sinh viên" sortable style="min-width: 10rem">
                                <template #body="slotProps">
                                    <div>
                                        <div class="font-medium">{{ slotProps.data.studentName }}</div>
                                        <div class="text-muted-color text-xs">{{ slotProps.data.studentEmail }}</div>
                                    </div>
                                </template>
                            </Column>
                            <Column header="Điểm" sortable style="min-width: 7rem">
                                <template #body="slotProps">
                                    <span :class="slotProps.data.passed ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'">{{ slotProps.data.score }}</span>
                                </template>
                            </Column>
                            <Column header="Kết quả" style="min-width: 7rem">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.passed ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'" :severity="slotProps.data.passed ? 'success' : 'danger'" />
                                </template>
                            </Column>
                            <Column header="Ngày nộp" sortable style="min-width: 10rem">
                                <template #body="slotProps">
                                    <span class="text-sm">{{ formatDate(slotProps.data.submittedAt) }}</span>
                                </template>
                            </Column>
                        </DataTable>

                        <div v-if="!loadingSubmissions && filteredSubmissions.length === 0" class="text-center text-muted-color py-8">Chưa có bài nộp nào</div>

                        <!-- Average Score Summary -->
                        <div v-if="submissions.length > 0" class="mt-4 p-3 bg-surface-50 dark:bg-surface-700 rounded-lg text-sm text-muted-color">
                            📊 Điểm trung bình: <strong>{{ avgScore }}/10</strong> | Tỷ lệ đạt: <strong>{{ Math.round((passedCount / submissions.length) * 100) }}%</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
