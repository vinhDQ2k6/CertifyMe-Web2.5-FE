<script setup>
import BlockchainInfo from '@/components/shared/BlockchainInfo.vue';
import CertificateCard from '@/components/student/CertificateCard.vue';
import QuizList from '@/components/student/QuizList.vue';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useStudent } from '@/composables/useStudent';
import CertificateService from '@/services/CertificateService';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { currentCourse, loading, getCourseDetail } = useStudent();
const { handleError, showSuccess } = useErrorHandler();
const showBlockchainInfo = ref(false);

onMounted(async () => {
    try {
        await getCourseDetail(route.params.id);
    } catch (err) {
        handleError(err, 'Tải chi tiết khóa học');
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

async function handleDownload() {
    if (!currentCourse.value?.certificate?.certificateId) return;
    try {
        await CertificateService.downloadCertificatePDF(currentCourse.value.certificate.certificateId);
        showSuccess('Thành công', 'Đã tải xuống chứng chỉ PDF');
    } catch (err) {
        handleError(err, 'Tải PDF chứng chỉ');
    }
}

function handleShare() {
    if (!currentCourse.value?.certificate?.verificationHash) return;
    const url = `${window.location.origin}/verify/${currentCourse.value.certificate.verificationHash}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showSuccess('Đã sao chép', 'Link xác minh đã được sao chép');
    }
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

        <div v-else-if="!currentCourse" class="card text-center py-12">
            <div class="text-4xl mb-3">📭</div>
            <p class="text-muted-color">Không tìm thấy thông tin khóa học.</p>
            <Button label="Quay lại" class="mt-4" @click="goBack" />
        </div>

        <div v-else>
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
