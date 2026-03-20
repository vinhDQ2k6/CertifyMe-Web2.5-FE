<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
    courseId: {
        type: String,
        required: false
    },
    id: {
        type: String,
        required: false
    },
    classId: {
        type: String,
        required: false
    },
    courseIcon: {
        type: String,
        default: '📚'
    },
    courseName: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        default: ''
    },
    teacherName: {
        type: String,
        default: ''
    },
    progress: {
        type: Number,
        default: 0
    },
    totalQuizzes: {
        type: Number,
        default: 0
    },
    completedQuizzes: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    averageScore: {
        type: Number,
        default: 0
    }
});

const router = useRouter();

function viewCourse() {
    const targetId = props.courseId || props.id || props.classId;
    if (targetId) {
        router.push({ name: 'courseDetail', params: { id: targetId } });
    }
}
</script>

<template>
    <div class="card cursor-pointer hover:shadow-lg transition-shadow" @click="viewCourse">
        <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl">{{ courseIcon }}</span>
            <div>
                <div class="text-surface-900 dark:text-surface-0 font-semibold text-lg">{{ courseName }}</div>
                <span class="text-muted-color text-sm">{{ courseCode }}</span>
            </div>
        </div>

        <div class="mb-3">
            <div class="flex justify-between mb-2">
                <span class="text-muted-color text-sm">Tiến độ</span>
                <span class="text-sm font-medium">{{ completedQuizzes }}/{{ totalQuizzes }} quiz</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" style="height: 0.5rem" />
        </div>

        <div class="flex items-center justify-between">
            <span class="text-muted-color text-sm">{{ teacherName }}</span>
            <Tag v-if="isCompleted" value="✅ PASSED" severity="success" />
            <Tag v-else :value="`${progress}%`" severity="info" />
        </div>

        <div class="mt-3 text-right">
            <Button v-if="isCompleted" label="Xem chứng chỉ" icon="pi pi-eye" size="small" text @click.stop="viewCourse" />
            <Button v-else label="Tiếp tục" icon="pi pi-arrow-right" size="small" text @click.stop="viewCourse" />
        </div>
    </div>
</template>
