<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    questionIndex: {
        type: Number,
        required: true
    },
    initialData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update', 'delete']);

const text = ref('');
const options = ref([
    { label: 'A', value: '', isCorrect: false },
    { label: 'B', value: '', isCorrect: false },
    { label: 'C', value: '', isCorrect: false },
    { label: 'D', value: '', isCorrect: false }
]);

watch(
    () => props.initialData,
    (data) => {
        if (data) {
            text.value = data.text || '';
            options.value = data.options ? data.options.map((opt) => ({ ...opt })) : options.value;
        }
    },
    { immediate: true }
);

function emitUpdate() {
    emit('update', {
        text: text.value,
        options: options.value
    });
}
</script>

<template>
    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
        <div class="flex justify-between items-center mb-3">
            <span class="font-medium">Câu hỏi {{ questionIndex + 1 }}</span>
            <Button icon="pi pi-trash" severity="danger" text size="small" @click="emit('delete')" />
        </div>

        <div class="mb-3">
            <InputText v-model="text" class="w-full" placeholder="Nội dung câu hỏi" @input="emitUpdate" />
        </div>

        <div class="grid grid-cols-12 gap-3">
            <div v-for="option in options" :key="option.label" class="col-span-6 flex items-center gap-2">
                <Checkbox v-model="option.isCorrect" :binary="true" @change="emitUpdate" />
                <span class="font-medium">{{ option.label }}:</span>
                <InputText v-model="option.value" class="flex-1" :placeholder="`Đáp án ${option.label}`" @input="emitUpdate" />
            </div>
        </div>
    </div>
</template>
