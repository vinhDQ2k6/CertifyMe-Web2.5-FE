import CourseService from '@/services/CourseService';
import CertificateService from '@/services/CertificateService';
import { computed, ref } from 'vue';

export function useStudent() {
    const courses = ref([]);
    const loading = ref(false);
    const currentCourse = ref(null);
    const certificates = ref([]);

    const inProgressCourses = computed(() => courses.value.filter((c) => !c.isCompleted));
    const completedCourses = computed(() => courses.value.filter((c) => c.isCompleted));

    const fetchCourses = async (studentId) => {
        loading.value = true;
        try {
            courses.value = await CourseService.getStudentCourses(studentId);
        } finally {
            loading.value = false;
        }
    };

    const getCourseDetail = async (courseId) => {
        loading.value = true;
        try {
            currentCourse.value = await CourseService.getCourseDetail(courseId);
            return currentCourse.value;
        } finally {
            loading.value = false;
        }
    };

    const fetchCertificates = async (studentId) => {
        loading.value = true;
        try {
            certificates.value = await CertificateService.getCertificatesForStudent(studentId);
        } finally {
            loading.value = false;
        }
    };

    return {
        courses,
        inProgressCourses,
        completedCourses,
        currentCourse,
        certificates,
        loading,
        fetchCourses,
        getCourseDetail,
        fetchCertificates
    };
}
