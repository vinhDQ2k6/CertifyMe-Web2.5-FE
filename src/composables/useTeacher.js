import CourseService from '@/services/CourseService';
import QuizService from '@/services/QuizService';
import { ref } from 'vue';

export function useTeacher() {
    const classes = ref([]);
    const currentClass = ref(null);
    const students = ref([]);
    const quizzes = ref([]);
    const loading = ref(false);

    const fetchClasses = async (teacherId) => {
        loading.value = true;
        try {
            classes.value = await CourseService.getTeacherClasses(teacherId);
        } finally {
            loading.value = false;
        }
    };

    const fetchClassDetail = async (classId) => {
        loading.value = true;
        try {
            currentClass.value = await CourseService.getClassDetail(classId);
            return currentClass.value;
        } finally {
            loading.value = false;
        }
    };

    const fetchStudents = async (classId) => {
        loading.value = true;
        try {
            students.value = await CourseService.getStudentsInClass(classId);
        } finally {
            loading.value = false;
        }
    };

    const fetchQuizzes = async (classId) => {
        loading.value = true;
        try {
            quizzes.value = await QuizService.getQuizzesForClass(classId);
        } finally {
            loading.value = false;
        }
    };

    const createQuiz = async (classId, data) => {
        loading.value = true;
        try {
            const quiz = await QuizService.createQuiz(classId, data);
            quizzes.value.push(quiz);
            return quiz;
        } finally {
            loading.value = false;
        }
    };

    const publishQuiz = async (quizId) => {
        loading.value = true;
        try {
            await QuizService.publishQuiz(quizId);
            const index = quizzes.value.findIndex((q) => q.id === quizId);
            if (index !== -1) {
                quizzes.value[index].status = 'published';
            }
        } finally {
            loading.value = false;
        }
    };

    return {
        classes,
        currentClass,
        students,
        quizzes,
        loading,
        fetchClasses,
        fetchClassDetail,
        fetchStudents,
        fetchQuizzes,
        createQuiz,
        publishQuiz
    };
}
