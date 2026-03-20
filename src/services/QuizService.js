import { fetchResource, createResource, updateResource, deleteResource } from '@/lib/apiFetcher';

const QuizService = {
    /**
     * Get quizzes for a class
     * API: GET /api/classes/{classId}/quizzes
     */
    async getQuizzesForClass(classId) {
        return await fetchResource(`/classes/${classId}/quizzes`);
    },

    /**
     * Get quiz detail with questions
     * API: GET /api/quizzes/{quizId}
     */
    async getQuizDetail(quizId) {
        return await fetchResource(`/quizzes/${quizId}`);
    },

    /**
     * Submit quiz answers
     * API: POST /api/quizzes/{quizId}/submit
     */
    async submitQuizAnswers(quizId, studentId, answers) {
        return await createResource(`/quizzes/${quizId}/submit`, { studentId, answers });
    },

    /**
     * Create a new quiz
     * API: POST /api/quizzes
     */
    async createQuiz(classId, data) {
        return await createResource('/quizzes', { classId, ...data });
    },

    /**
     * Update quiz
     * API: PUT /api/quizzes/{quizId}
     */
    async updateQuiz(quizId, data) {
        return await updateResource(`/quizzes/${quizId}`, data);
    },

    /**
     * Publish quiz (activate)
     */
    async publishQuiz(quizId) {
        return await updateResource(`/quizzes/${quizId}`, { status: 'active' });
    },

    /**
     * Delete quiz
     * API: DELETE /api/quizzes/{quizId}
     */
    async deleteQuiz(quizId) {
        return await deleteResource(`/quizzes/${quizId}`);
    },

    /**
     * Get quiz result for current student (auto-detects from token)
     * API: GET /api/quizzes/{quizId}/result
     */
    async getQuizResult(quizId) {
        return await fetchResource(`/quizzes/${quizId}/result`);
    },

    /**
     * Get quiz submissions (for teacher)
     * API: GET /api/quizzes/{quizId}/submissions
     */
    async getQuizSubmissions(quizId) {
        return await fetchResource(`/quizzes/${quizId}/submissions`);
    }
};

export default QuizService;
