import axiosInstance from './axiosInstance.js';
import ApiError from './errors.js';

/**
 * Unwrap ApiResponse and return data directly
 * Backend returns: { success: boolean, message?: string, data: T, error?: string }
 */
function unwrapResponse(response) {
    const apiResponse = response.data;
    if (apiResponse.success === false) {
        throw new ApiError(response.status, 'API_ERROR', apiResponse.error || apiResponse.message || 'API Error');
    }
    return apiResponse.data;
}

async function fetchResource(resourceUrl, requestOptions = {}) {
    try {
        const response = await axiosInstance.get(resourceUrl, requestOptions);
        return unwrapResponse(response);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

async function createResource(resourceUrl, resourceData, requestOptions = {}) {
    try {
        const response = await axiosInstance.post(resourceUrl, resourceData, requestOptions);
        return unwrapResponse(response);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

async function updateResource(resourceUrl, resourceData, requestOptions = {}) {
    try {
        const response = await axiosInstance.put(resourceUrl, resourceData, requestOptions);
        return unwrapResponse(response);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

async function deleteResource(resourceUrl, requestOptions = {}) {
    try {
        const response = await axiosInstance.delete(resourceUrl, requestOptions);
        return unwrapResponse(response);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(error.response?.status, error.code, error.message, error);
    }
}

export { createResource, deleteResource, fetchResource, updateResource };
