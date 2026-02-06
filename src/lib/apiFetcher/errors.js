class ApiError extends Error {
    constructor(statusCode, errorCode, errorMessage, originalError) {
        super(errorMessage);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.originalError = originalError;
    }
}

export default ApiError;
