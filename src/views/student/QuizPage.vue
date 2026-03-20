<script setup>
import { useErrorHandler } from '@/composables/useErrorHandler';
import AuthService from '@/services/AuthService';
import QuizService from '@/services/QuizService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { handleError } = useErrorHandler();

let studentId = null;

const quiz = ref(null);
const loading = ref(false);
const submitting = ref(false);
const answers = ref({});
const currentQuestionIndex = ref(0);
const timeLeft = ref(0);
const timerInterval = ref(null);
const showResult = ref(false);
const result = ref(null);

const currentQuestion = computed(() => quiz.value?.questions[currentQuestionIndex.value]);
const totalQuestions = computed(() => quiz.value?.questions?.length || 0);
const answeredCount = computed(() => Object.keys(answers.value).length);
const progressPercent = computed(() => (totalQuestions.value > 0 ? Math.round((answeredCount.value / totalQuestions.value) * 100) : 0));
const isLastQuestion = computed(() => currentQuestionIndex.value === totalQuestions.value - 1);
const isFirstQuestion = computed(() => currentQuestionIndex.value === 0);

const timeLeftFormatted = computed(() => {
    const mins = Math.floor(timeLeft.value / 60);
    const secs = timeLeft.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const timerSeverity = computed(() => {
    if (timeLeft.value > 300) return 'success';
    if (timeLeft.value > 60) return 'warn';
    return 'danger';
});

function startTimer(minutes) {
    timeLeft.value = minutes * 60;
    timerInterval.value = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            clearInterval(timerInterval.value);
            handleAutoSubmit();
        }
    }, 1000);
}

async function handleAutoSubmit() {
    toast.add({ severity: 'warn', summary: 'Hết giờ!', detail: 'Tự động nộp bài', life: 3000 });
    await submitQuiz();
}

onMounted(async () => {
    loading.value = true;
    try {
        // Get studentId from JWT token
        const userInfo = AuthService.getUserFromToken();
        if (!userInfo?.userId) {
            throw new Error('Unable to get student ID');
        }
        studentId = userInfo.userId;

        const data = await QuizService.getQuizDetail(route.params.quizId);
        // Normalize API response: convert optionA/B/C/D to options array
        const normalizedQuestions = (data.questions || []).map((q) => ({
            ...q,
            options: ['A', 'B', 'C', 'D'].map((letter) => q[`option${letter}`])
        }));
        quiz.value = { ...data, questions: normalizedQuestions };
    } catch (err) {
        handleError(err, 'Tải đề thi');
    } finally {
        loading.value = false;
        if (quiz.value?.duration) {
            startTimer(quiz.value.duration);
        }
    }
});

onUnmounted(() => {
    if (timerInterval.value) clearInterval(timerInterval.value);
});

function selectAnswer(questionId, option) {
    answers.value = { ...answers.value, [questionId]: option };
}

function prevQuestion() {
    if (!isFirstQuestion.value) currentQuestionIndex.value--;
}

function nextQuestion() {
    if (!isLastQuestion.value) currentQuestionIndex.value++;
}

function jumpToQuestion(index) {
    currentQuestionIndex.value = index;
}

async function submitQuiz() {
    if (timerInterval.value) clearInterval(timerInterval.value);
    submitting.value = true;
    try {
        if (!studentId) {
            throw new Error('Student ID not found');
        }
        // Convert answers format: map answer value back to letter (A/B/C/D)
        const submissionAnswers = Object.entries(answers.value).map(([questionId, answer]) => {
            const question = quiz.value.questions.find((q) => q.questionId === parseInt(questionId) || q.id === questionId);
            const letter = question ? ['A', 'B', 'C', 'D'][question.options.indexOf(answer)] : null;
            return { questionId: parseInt(questionId), selectedOption: letter || answer };
        });
        const res = await QuizService.submitQuizAnswers(route.params.quizId, studentId, submissionAnswers);
        result.value = res;
        showResult.value = true;
    } catch (err) {
        handleError(err, 'Nộp bài');
    } finally {
        submitting.value = false;
    }
}

function confirmSubmit() {
    const unanswered = totalQuestions.value - answeredCount.value;
    if (unanswered > 0) {
        const confirmed = window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn vẫn muốn nộp bài?`);
        if (!confirmed) return;
    }
    submitQuiz();
}

function goBack() {
    router.back();
}
</script>

<template>
    <div>
        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <!-- Quiz Result -->
        <div v-else-if="showResult && result" class="max-w-2xl mx-auto">
            <div class="card text-center">
                <div class="text-5xl mb-4">{{ result.status === 'PASSED' ? '🎉' : '😔' }}</div>
                <h3 class="text-2xl font-bold mb-2">{{ result.status === 'PASSED' ? 'Chúc mừng! Bạn đã qua!' : 'Chưa đạt yêu cầu' }}</h3>

                <div class="grid grid-cols-3 gap-4 my-6">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-primary">{{ result.score }}/{{ result.maxScore }}</div>
                        <div class="text-muted-color text-sm">Điểm số</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold">{{ answeredCount }}/{{ totalQuestions }}</div>
                        <div class="text-muted-color text-sm">Đã trả lời</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold">{{ result.submittedAt ? new Date(result.submittedAt).toLocaleTimeString('vi-VN') : '--' }}</div>
                        <div class="text-muted-color text-sm">Thời gian nộp</div>
                    </div>
                </div>

                <Tag :value="result.status === 'PASSED' ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'" :severity="result.status === 'PASSED' ? 'success' : 'danger'" class="text-lg px-4 py-2 mb-6" />

                <div class="flex justify-center gap-3">
                    <Button label="Quay về khóa học" icon="pi pi-arrow-left" @click="goBack" />
                </div>
            </div>
        </div>

        <!-- Quiz In Progress -->
        <div v-else-if="quiz">
            <div class="card mb-4">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h4 class="m-0 font-bold">📝 {{ quiz.quizName }}</h4>
                        <span class="text-muted-color text-sm">Câu {{ currentQuestionIndex + 1 }}/{{ totalQuestions }}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <!-- Progress -->
                        <div class="text-center">
                            <div class="text-sm text-muted-color mb-1">Đã trả lời: {{ answeredCount }}/{{ totalQuestions }}</div>
                            <ProgressBar :value="progressPercent" style="height: 0.4rem; width: 8rem" :showValue="false" />
                        </div>
                        <!-- Timer -->
                        <div
                            v-if="quiz.timeLimit"
                            :class="[
                                'flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-lg font-bold',
                                timerSeverity === 'danger'
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : timerSeverity === 'warn'
                                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                      : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            ]"
                        >
                            <i class="pi pi-clock"></i>
                            {{ timeLeftFormatted }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <!-- Question Navigator -->
                <div class="col-span-12 md:col-span-3">
                    <div class="card">
                        <h6 class="font-semibold mb-3">Danh sách câu hỏi</h6>
                        <div class="grid grid-cols-5 gap-1">
                            <button
                                v-for="(q, idx) in quiz.questions"
                                :key="q.questionId"
                                :class="[
                                    'w-8 h-8 rounded text-sm font-medium transition-colors',
                                    idx === currentQuestionIndex ? 'bg-primary text-white' : answers[q.questionId] ? 'bg-green-500 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200'
                                ]"
                                @click="jumpToQuestion(idx)"
                            >
                                {{ idx + 1 }}
                            </button>
                        </div>
                        <div class="mt-4 flex flex-col gap-1 text-xs text-muted-color">
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-primary inline-block"></span> Đang xem</div>
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-green-500 inline-block"></span> Đã trả lời</div>
                            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-surface-200 dark:bg-surface-600 inline-block"></span> Chưa trả lời</div>
                        </div>
                    </div>
                </div>

                <!-- Current Question -->
                <div class="col-span-12 md:col-span-9">
                    <div v-if="currentQuestion" class="card">
                        <div class="flex items-start gap-3 mb-6">
                            <span class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">{{ currentQuestionIndex + 1 }}</span>
                            <p class="text-lg font-medium m-0">{{ currentQuestion.questionText }}</p>
                        </div>

                        <!-- Multiple Choice Options -->
                        <div v-if="currentQuestion.questionType === 'MULTIPLE_CHOICE' || !currentQuestion.questionType" class="flex flex-col gap-3">
                            <div
                                v-for="(option, optIdx) in currentQuestion.options"
                                :key="optIdx"
                                :class="[
                                    'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                                    answers[currentQuestion.questionId] === option
                                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                        : 'border-surface-200 dark:border-surface-600 hover:border-primary/50 hover:bg-surface-50 dark:hover:bg-surface-700'
                                ]"
                                @click="selectAnswer(currentQuestion.questionId, option)"
                            >
                                <span :class="['w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0', answers[currentQuestion.questionId] === option ? 'border-primary' : 'border-surface-400']">
                                    <span v-if="answers[currentQuestion.questionId] === option" class="w-3 h-3 rounded-full bg-primary"></span>
                                </span>
                                <span>{{ option }}</span>
                            </div>
                        </div>

                        <!-- Short Answer -->
                        <div v-else-if="currentQuestion.questionType === 'SHORT_ANSWER'">
                            <Textarea :value="answers[currentQuestion.questionId] || ''" @input="selectAnswer(currentQuestion.questionId, $event.target.value)" rows="4" class="w-full" placeholder="Nhập câu trả lời của bạn..." />
                        </div>

                        <!-- Navigation Buttons -->
                        <div class="flex justify-between mt-6">
                            <Button label="← Câu trước" outlined :disabled="isFirstQuestion" @click="prevQuestion" />
                            <Button v-if="!isLastQuestion" label="Câu tiếp →" @click="nextQuestion" />
                            <Button v-else label="📤 Nộp bài" severity="success" icon="pi pi-send" :loading="submitting" @click="confirmSubmit" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Submit Button (bottom) -->
            <div class="card mt-4">
                <div class="flex items-center justify-between">
                    <span class="text-muted-color"
                        >Đã trả lời: <strong>{{ answeredCount }}/{{ totalQuestions }}</strong></span
                    >
                    <Button label="Nộp bài ngay" icon="pi pi-send" severity="success" :loading="submitting" @click="confirmSubmit" />
                </div>
            </div>
        </div>

        <!-- Error / Not Found -->
        <div v-else class="card text-center py-12">
            <div class="text-5xl mb-4">📭</div>
            <p class="text-muted-color">Không tìm thấy đề thi.</p>
            <Button label="Quay lại" class="mt-4" @click="goBack" />
        </div>
    </div>
</template>
