# API Fetcher

A clean, reusable API helper using Axios for making HTTP requests.

## Features

- Centralized Axios instance with interceptors
- Custom ApiError class for error handling
- Simple, descriptive function names
- Supports GET, POST, PUT, DELETE methods

## Usage

```javascript
import { fetchResource, createResource, updateResource, deleteResource, ApiError } from '@/lib/apiFetcher';

// GET request
const data = await fetchResource('/users');

// POST request
const newUser = await createResource('/users', { name: 'John', email: 'john@example.com' });

// PUT request
const updatedUser = await updateResource('/users/1', { name: 'Jane' });

// DELETE request
await deleteResource('/users/1');

// Error handling
try {
    await fetchResource('/invalid');
} catch (error) {
    if (error instanceof ApiError) {
        console.log(error.statusCode, error.errorMessage);
    }
}
```

## Configuration

Set `VITE_API_BASE_URL` in your environment variables.
