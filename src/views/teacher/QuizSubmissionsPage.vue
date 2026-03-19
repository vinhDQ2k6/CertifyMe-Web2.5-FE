<script setup>
import { useTeacher } from '@/composables/useTeacher';
import QuizService from '@/services/QuizService';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { quizzes, loading, fetchQuizzes } = useTeacher();

const submissions = ref([]);
const loadingSubmissions = ref(false);
const selectedQuiz = ref(null);
const searchQuery = ref('');

// Mock data for FE-only testing (remove when integrating with BE)
const mockSubmissions = [
    { id: 'sub1', studentName: 'Nguyễn Văn An', email: 'annv@fpt.edu.vn', score: 8.5, maxScore: 10, isPassed: true, submittedAt: '2026-02-15T10:30:00', timeSpent: 1200 },
    { id: 'sub2', studentName: 'Trần Thị Bình', email: 'binhtt@fpt.edu.vn', score: 9.0, maxScore: 10, isPassed: true, submittedAt: '2026-02-15T11:00:00', timeSpent: 900 },
    { id: 'sub3', studentName: 'Lê Văn Cường', email: 'cuonglv@fpt.edu.vn', score: 4.5, maxScore: 10, isPassed: false, submittedAt: '2026-02-15T11:45:00', timeSpent: 1800 },
    { id: 'sub4', studentName: 'Phạm Thị Dung', email: 'dungpt@fpt.edu.vn', score: 7.5, maxScore: 10, isPassed: true, submittedAt: '2026-02-15T14:00:00', timeSpent: 1500 },
    { id: 'sub5', studentName: 'Hoàng Minh Đức', email: 'duchm@fpt.edu.vn', score: 3.0, maxScore: 10, isPassed: false, submittedAt: '2026-02-16T09:00:00', timeSpent: 2100 }
];

const mockQuizzes = [
    { id: 'q1', name: 'Lab 1: Biến và kiểu dữ liệu', questionsCount: 10, passingScore: 5.0, status: 'published' },
    { id: 'q2', name: 'Lab 2: Vòng lặp và mảng', questionsCount: 10, passingScore: 5.0, status: 'published' },
    { id: 'q3', name: 'Lab 3: OOP cơ bản', questionsCount: 10, passingScore: 5.0, status: 'published' }
];

const filteredSubmissions = computed(() => {
    if (!searchQuery.value.trim()) return submissions.value;
    const q = searchQuery.value.toLowerCase();
    return submissions.value.filter((s) => s.studentName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
});

const passedCount = computed(() => submissions.value.filter((s) => s.isPassed).length);
const failedCount = computed(() => submissions.value.filter((s) => !s.isPassed).length);
const avgScore = computed(() => {
    if (!submissions.value.length) return 0;
    const sum = submissions.value.reduce((acc, s) => acc + s.score, 0);
    return Math.round((sum / submissions.value.length) * 10) / 10;
});

onMounted(async () => {
    try {
        await fetchQuizzes(route.params.classId);
    } catch {
        quizzes.value = mockQuizzes;
    }
    if (quizzes.value.length === 0) quizzes.value = mockQuizzes;
});

async function loadSubmissions(quiz) {
    selectedQuiz.value = quiz;
    loadingSubmissions.value = true;
    try {
        const data = await QuizService.getQuizSubmissions(quiz.id);
        submissions.value = data;
    } catch {
        submissions.value = mockSubmissions;
    } finally {
        loadingSubmissions.value = false;
    }
}

function goBack() {
    router.push({ name: 'quizManagement', params: { classId: route.params.classId } });
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN');
}

function exportCSV() {
    if (!submissions.value.length) return;
    const headers = ['Họ tên', 'Email', 'Điểm', 'Kết quả', 'Thời gian làm', 'Ngày nộp'];
    const rows = submissions.value.map((s) => [
        s.studentName,
        s.email,
        `${s.score}/${s.maxScore}`,
        s.isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT',
        formatTime(s.timeSpent),
        formatDate(s.submittedAt)
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${selectedQuiz.value?.id || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({ severity: 'success', summary: 'Xuất file thành công', detail: 'Đã tải xuống file CSV', life: 3000 });
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
                            :class="[
                                'p-3 rounded-lg border-2 cursor-pointer transition-all',
                                selectedQuiz?.id === quiz.id
                                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                    : 'border-surface-200 dark:border-surface-600 hover:border-primary/50'
                            ]"
                            @click="loadSubmissions(quiz)"
                        >
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ quiz.name }}</div>
                            <div class="flex items-center gap-2 mt-1">
                                <Tag :value="quiz.status === 'published' ? '🟢 Published' : '📝 Draft'" :severity="quiz.status === 'published' ? 'success' : 'warn'" />
                                <span class="text-muted-color text-xs">{{ quiz.questionsCount }} câu</span>
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
                                <h5 class="m-0">📋 Bài nộp - {{ selectedQuiz.name }}</h5>
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
                                        <div class="text-muted-color text-xs">{{ slotProps.data.email }}</div>
                                    </div>
                                </template>
                            </Column>
                            <Column header="Điểm" sortable style="min-width: 7rem">
                                <template #body="slotProps">
                                    <span :class="slotProps.data.isPassed ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'">
                                        {{ slotProps.data.score }}/{{ slotProps.data.maxScore }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Kết quả" style="min-width: 7rem">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.isPassed ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'" :severity="slotProps.data.isPassed ? 'success' : 'danger'" />
                                </template>
                            </Column>
                            <Column header="Thời gian" style="min-width: 7rem">
                                <template #body="slotProps">
                                    <span class="font-mono">{{ formatTime(slotProps.data.timeSpent) }}</span>
                                </template>
                            </Column>
                            <Column header="Ngày nộp" sortable style="min-width: 10rem">
                                <template #body="slotProps">
                                    <span class="text-sm">{{ formatDate(slotProps.data.submittedAt) }}</span>
                                </template>
                            </Column>
                        </DataTable>

                        <div v-if="!loadingSubmissions && filteredSubmissions.length === 0" class="text-center text-muted-color py-8">
                            Chưa có bài nộp nào
                        </div>

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
