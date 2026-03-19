<script setup>
import QuizList from '@/components/student/QuizList.vue';
import CertificateCard from '@/components/student/CertificateCard.vue';
import BlockchainInfo from '@/components/shared/BlockchainInfo.vue';
import { useStudent } from '@/composables/useStudent';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';

const route = useRoute();
const router = useRouter();
const { currentCourse, loading, getCourseDetail } = useStudent();
const showBlockchainInfo = ref(false);

// Mock data for FE-only testing (remove when integrating with BE)
const mockCourseInProgress = {
    courseIcon: '☕',
    courseName: 'Lập trình Java 6',
    courseCode: 'SD18301',
    teacherName: 'Thầy Nguyễn Văn A',
    startDate: '01/01/2026',
    endDate: '01/04/2026',
    progress: 80,
    totalQuizzes: 5,
    completedQuizzes: 4,
    isCompleted: false,
    studentName: 'Trần Văn B',
    averageScore: 8.5,
    quizzes: [
        { id: 'q1', name: 'Lab 1: Biến và kiểu dữ liệu', score: 8.5, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q2', name: 'Lab 2: Vòng lặp và mảng', score: 9.0, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q3', name: 'Lab 3: OOP cơ bản', score: 7.5, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q4', name: 'Lab 4: Kế thừa và đa hình', score: 8.0, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q5', name: 'Lab 5: Collections Framework', score: null, maxScore: 10, status: 'pending', isAvailable: true }
    ]
};

const mockCourseCompleted = {
    courseIcon: '🐍',
    courseName: 'Lập trình Python',
    courseCode: 'SD18101',
    teacherName: 'Cô Phạm Thị D',
    startDate: '01/09/2025',
    endDate: '01/12/2025',
    progress: 100,
    totalQuizzes: 5,
    completedQuizzes: 5,
    isCompleted: true,
    studentName: 'Trần Văn B',
    averageScore: 9.2,
    completionDate: '2025-12-01',
    quizzes: [
        { id: 'q1', name: 'Lab 1: Cú pháp Python', score: 9.0, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q2', name: 'Lab 2: List và Dictionary', score: 9.5, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q3', name: 'Lab 3: Functions', score: 8.5, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q4', name: 'Lab 4: File I/O', score: 9.0, maxScore: 10, status: 'completed', isAvailable: true },
        { id: 'q5', name: 'Lab 5: OOP in Python', score: 10, maxScore: 10, status: 'completed', isAvailable: true }
    ],
    certificate: {
        verificationHash: '0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        blockchainInfo: {
            hash: '0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
            block: '12345678',
            txHash: '0x999888777666555444333222111000aaabbbccc',
            contract: '0xABC123DEF456789012345678901234567890ABCD'
        }
    }
};

onMounted(async () => {
    try {
        await getCourseDetail(route.params.id);
    } catch {
        // ignore API errors in FE-only mode
    }
    // Use mock data if no course loaded from API
    if (!currentCourse.value) {
        currentCourse.value = route.params.id === 'c4' ? mockCourseCompleted : mockCourseInProgress;
    }
});

function goBack() {
    router.push({ name: 'studentDashboard' });
}

function handleQuizAction({ quizId, action }) {
    if (action === 'start' || action === 'review') {
        router.push({ name: 'quizPage', params: { quizId } });
    }
}

function handleDownload() {
    console.log('Download certificate');
}

function handleShare() {
    console.log('Share certificate');
}

function handleVerify() {
    showBlockchainInfo.value = !showBlockchainInfo.value;
}
</script>

<template>
    <div>
        <!-- Back Button -->
        <Button label="← Quay lại" text class="mb-4" @click="goBack" />

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="currentCourse">
            <!-- Course Header -->
            <div class="card mb-4">
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-3xl">{{ currentCourse.courseIcon || '📚' }}</span>
                    <div>
                        <h3 class="m-0 text-surface-900 dark:text-surface-0">{{ currentCourse.courseName }}</h3>
                        <span class="text-muted-color">Lớp: {{ currentCourse.courseCode }} | GV: {{ currentCourse.teacherName }}</span>
                    </div>
                </div>
                <div class="text-muted-color text-sm">📅 {{ currentCourse.startDate }} - {{ currentCourse.endDate }}</div>
            </div>

            <!-- Progress Section -->
            <div class="card mb-4">
                <div class="flex justify-between mb-2">
                    <span class="font-medium">Tiến độ</span>
                    <span class="font-medium">{{ currentCourse.progress || 0 }}% ({{ currentCourse.completedQuizzes || 0 }}/{{ currentCourse.totalQuizzes || 0 }} quiz)</span>
                </div>
                <ProgressBar :value="currentCourse.progress || 0" />
            </div>

            <!-- Quiz List -->
            <div class="card mb-4">
                <h5 class="mb-4">📝 Danh sách Quiz</h5>
                <QuizList :quizzes="currentCourse.quizzes || []" :isCompleted="currentCourse.isCompleted" @actionClick="handleQuizAction" />
            </div>

            <!-- Certificate Section -->
            <div v-if="currentCourse.isCompleted" class="mb-4">
                <CertificateCard
                    :studentName="currentCourse.studentName"
                    :courseName="currentCourse.courseName"
                    :courseCode="currentCourse.courseCode"
                    :grade="currentCourse.averageScore"
                    :completionDate="currentCourse.completionDate"
                    :verificationHash="currentCourse.certificate?.verificationHash"
                    :blockchainInfo="currentCourse.certificate?.blockchainInfo"
                    @download="handleDownload"
                    @share="handleShare"
                    @verify="handleVerify"
                />

                <div v-if="showBlockchainInfo && currentCourse.certificate?.blockchainInfo" class="mt-4">
                    <BlockchainInfo
                        :verificationHash="currentCourse.certificate.blockchainInfo.hash"
                        :blockNumber="currentCourse.certificate.blockchainInfo.block"
                        :transactionHash="currentCourse.certificate.blockchainInfo.txHash"
                        :contractAddress="currentCourse.certificate.blockchainInfo.contract"
                        status="ISSUED"
                    />
                </div>
            </div>

            <!-- Locked Certificate Section -->
            <div v-else class="card">
                <div class="text-center py-6">
                    <div class="text-4xl mb-3">🔒</div>
                    <h5 class="text-muted-color">Hoàn thành tất cả quiz để nhận chứng chỉ</h5>
                    <p class="text-muted-color">Còn lại: {{ (currentCourse.totalQuizzes || 0) - (currentCourse.completedQuizzes || 0) }} quiz</p>
                </div>
            </div>
        </div>
    </div>
</template>
