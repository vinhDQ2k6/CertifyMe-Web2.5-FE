// Unit tests for apiFetcher

// Note: Requires Vitest or Jest to run these tests.
// To install Vitest: npm install --save-dev vitest @vue/test-utils jsdom

// Example tests:

// import { describe, it, expect, vi } from 'vitest';
// import { fetchResource, createResource, ApiError } from '../apiFetcher.js';
// import axiosInstance from '../axiosInstance.js';

// vi.mock('../axiosInstance.js');

// describe('fetchResource', () => {
//   it('should return data on successful GET request', async () => {
//     const mockData = { id: 1, name: 'Test' };
//     axiosInstance.get.mockResolvedValue({ data: mockData });

//     const result = await fetchResource('/test');
//     expect(result).toEqual(mockData);
//   });

//   it('should throw ApiError on failed request', async () => {
//     const mockError = { response: { status: 404 }, code: 'ERR_BAD_REQUEST', message: 'Not Found' };
//     axiosInstance.get.mockRejectedValue(mockError);

//     await expect(fetchResource('/test')).rejects.toThrow(ApiError);
//   });
// });

// describe('createResource', () => {
//   it('should return data on successful POST request', async () => {
//     const mockData = { id: 2, name: 'New' };
//     axiosInstance.post.mockResolvedValue({ data: mockData });

//     const result = await createResource('/test', { name: 'New' });
//     expect(result).toEqual(mockData);
//   });
// });

// Similar tests for updateResource and deleteResource.
