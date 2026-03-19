import { fetchResource, createResource, updateResource, deleteResource } from '@/lib/apiFetcher';

const QuizService = {
    async getQuizzesForCourse(courseId) {
        return await fetchResource(`/courses/${courseId}/quizzes`);
    },

    async getQuizDetail(quizId) {
        return await fetchResource(`/quizzes/${quizId}`);
    },

    async submitQuizAnswers(quizId, answers) {
        return await createResource(`/quizzes/${quizId}/submit`, { answers });
    },

    async createQuiz(classId, data) {
        return await createResource('/quizzes', { classId, ...data });
    },

    async updateQuiz(quizId, data) {
        return await updateResource(`/quizzes/${quizId}`, data);
    },

    async publishQuiz(quizId) {
        return await updateResource(`/quizzes/${quizId}`, { status: 'published' });
    },

    async deleteQuiz(quizId) {
        return await deleteResource(`/quizzes/${quizId}`);
    },

    async getStudentQuizResults(studentId, courseId) {
        return await fetchResource(`/student/${studentId}/results`, { params: { courseId } });
    },

    // Lấy danh sách quiz theo classId (dùng cho giáo viên)
    async getQuizzesForClass(classId) {
        return await fetchResource(`/classes/${classId}/quizzes`);
    },

    // Lấy danh sách bài nộp của một quiz
    async getQuizSubmissions(quizId) {
        return await fetchResource(`/quizzes/${quizId}/submissions`);
    }
};

export default QuizService;
