import { fetchResource, createResource, updateResource } from '@/lib/apiFetcher';

const CourseService = {
    async getStudentCourses(studentId) {
        return await fetchResource(`/student/${studentId}/courses`);
    },

    async getCourseDetail(courseId) {
        return await fetchResource(`/courses/${courseId}`);
    },

    async getTeacherClasses(teacherId) {
        return await fetchResource(`/teacher/${teacherId}/classes`);
    },

    async getClassDetail(classId) {
        return await fetchResource(`/classes/${classId}`);
    },

    async getStudentsInClass(classId) {
        return await fetchResource(`/classes/${classId}/students`);
    },

    async createClass(data) {
        return await createResource('/classes', data);
    },

    async updateClass(classId, data) {
        return await updateResource(`/classes/${classId}`, data);
    }
};

export default CourseService;
