import axiosInstance from './axiosInstance.js';
import ApiError from './errors.js';

async function fetchResource(resourceUrl, requestOptions = {}) {
    try {
        const response = await axiosInstance.get(resourceUrl, requestOptions);
        return response.data;
    } catch (error) {
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

async function createResource(resourceUrl, resourceData, requestOptions = {}) {
    try {
        const response = await axiosInstance.post(resourceUrl, resourceData, requestOptions);
        return response.data;
    } catch (error) {
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

async function updateResource(resourceUrl, resourceData, requestOptions = {}) {
    try {
        const response = await axiosInstance.put(resourceUrl, resourceData, requestOptions);
        return response.data;
    } catch (error) {
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

async function deleteResource(resourceUrl, requestOptions = {}) {
    try {
        const response = await axiosInstance.delete(resourceUrl, requestOptions);
        return response.data;
    } catch (error) {
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

export { createResource, deleteResource, fetchResource, updateResource };
