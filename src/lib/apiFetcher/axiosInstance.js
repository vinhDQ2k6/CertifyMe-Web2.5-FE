import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for adding authorization token
axiosInstance.interceptors.request.use(
    (configuration) => {
        const authenticationToken = localStorage.getItem('authToken');
        if (authenticationToken) {
            configuration.headers.Authorization = `Bearer ${authenticationToken}`;
        }
        return configuration;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access, e.g., redirect to login
            console.warn('Unauthorized access detected');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
