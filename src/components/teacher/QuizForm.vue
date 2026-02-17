<script setup>
import QuestionForm from './QuestionForm.vue';
import { ref, watch } from 'vue';

const props = defineProps({
    quizId: {
        type: String,
        default: null
    },
    classId: {
        type: String,
        default: ''
    },
    initialData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['save', 'close']);

const name = ref('');
const duration = ref(60);
const passingScore = ref(5.0);
const questions = ref([]);

watch(
    () => props.initialData,
    (data) => {
        if (data) {
            name.value = data.name || '';
            duration.value = data.duration || 60;
            passingScore.value = data.passingScore || 5.0;
            questions.value = data.questions ? [...data.questions] : [];
        }
    },
    { immediate: true }
);

function addQuestion() {
    questions.value.push({
        text: '',
        options: [
            { label: 'A', value: '', isCorrect: false },
            { label: 'B', value: '', isCorrect: false },
            { label: 'C', value: '', isCorrect: false },
            { label: 'D', value: '', isCorrect: false }
        ]
    });
}

function updateQuestion(index, data) {
    questions.value[index] = data;
}

function deleteQuestion(index) {
    questions.value.splice(index, 1);
}

function getFormData() {
    return {
        name: name.value,
        duration: duration.value,
        passingScore: passingScore.value,
        questions: questions.value
    };
}

function saveDraft() {
    emit('save', { data: getFormData(), action: 'draft' });
}

function publish() {
    emit('save', { data: getFormData(), action: 'publish' });
}
</script>

<template>
    <Card>
        <template #title>
            <span>📝 {{ quizId ? 'Sửa Quiz' : 'Tạo Quiz' }}</span>
        </template>
        <template #content>
            <div class="flex flex-col gap-4">
                <div>
                    <label for="quizName" class="block font-medium mb-2">Tên quiz</label>
                    <InputText id="quizName" v-model="name" class="w-full" placeholder="Nhập tên quiz" />
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="duration" class="block font-medium mb-2">Thời gian (phút)</label>
                        <InputNumber id="duration" v-model="duration" :min="1" class="w-full" />
                    </div>
                    <div class="col-span-6">
                        <label for="passingScore" class="block font-medium mb-2">Điểm qua</label>
                        <InputNumber id="passingScore" v-model="passingScore" :min="0" :max="10" :minFractionDigits="1" class="w-full" />
                    </div>
                </div>

                <div class="mt-4">
                    <h6 class="mb-2">Câu hỏi</h6>
                    <QuestionForm v-for="(question, index) in questions" :key="index" :questionIndex="index" :initialData="question" @update="updateQuestion(index, $event)" @delete="deleteQuestion(index)" class="mb-4" />
                    <Button label="+ Thêm câu hỏi" icon="pi pi-plus" severity="secondary" text @click="addQuestion" />
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Hủy" text @click="emit('close')" />
                <Button label="Lưu Draft" severity="secondary" @click="saveDraft" />
                <Button label="🚀 Publish" @click="publish" />
            </div>
        </template>
    </Card>
</template>
