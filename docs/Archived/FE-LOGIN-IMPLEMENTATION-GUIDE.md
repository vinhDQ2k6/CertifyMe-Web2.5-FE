# 🔐 HƯỚNG DẪN TRIỂN KHAI ĐĂNG NHẬP OAUTH2 - FRONTEND

> **Ngày**: 2026-02-21  
> **Version**: 1.0  
> **Mục đích**: Hướng dẫn chi tiết, kỹ càng từng bước triển khai authentication với Google OAuth2 cho Frontend Vue 3

---

## 📑 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc hiện tại & Vấn đề cần sửa](#2-kiến-trúc-hiện-tại--vấn-đề-cần-sửa)
3. [Kế hoạch chi tiết](#3-kế-hoạch-chi-tiết)
4. [Triển khai từng file](#4-triển-khai-từng-file)
5. [Testing & Verification](#5-testing--verification)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. TỔNG QUAN

### 1.1 Luồng OAuth2 Redirect Flow

```
┌─────────────────┐
│   Frontend      │
│   (Vue 3)       │
│                 │
│  Click Login    │
│      ↓          │
│  Redirect →     │
└────────┼────────┘
         │ http://localhost:8080/oauth2/authorization/google
         ↓
┌──────────────────────────────────────┐
│         Backend (Spring Boot)        │
│  ┌────────────────────────────────┐  │
│  │ 1. Redirect to Google OAuth2   │  │
│  │ 2. User authenticates          │  │
│  │ 3. Exchange code for token     │  │
│  │ 4. Get user info from Google   │  │
│  │ 5. Find/create user in DB      │  │
│  │ 6. Generate JWT token          │  │
│  │ 7. Redirect back to FE         │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
         │ http://localhost:3000/oauth2/redirect?token=<JWT>
         ↓
┌────────────────────────────────────────┐
│   FE OAuth2RedirectHandler Component   │
│                                        │
│  1. Extract token from URL             │
│  2. Save to localStorage               │
│  3. Decode JWT → Get user info         │
│  4. Set axios Authorization header     │
│  5. Redirect to role dashboard         │
└────────────────────────────────────────┘
         │ /student/dashboard (or teacher/admin)
         ↓
┌────────────────────────────────────────┐
│        User Dashboard (Protected)      │
│                                        │
│  All subsequent API calls have:        │
│  Header: Authorization: Bearer <JWT>   │
└────────────────────────────────────────┘
```

### 1.2 API Response Format (Backend đã implement)

**Tất cả responses using `ApiResponse<T>` wrapper:**

```json
// Success (200)
{
  "success": true,
  "data": { /* your data */ },
  "message": "optional message",
  "error": null
}

// Error (4xx, 5xx)
{
  "success": false,
  "data": null,
  "message": null,
  "error": "Error message here"
}
```

### 1.3 JWT Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFubnZAZnB0LmVkdS52biIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzA5MTIzNDU2LCJleHAiOjE3MDkyMDk4NTZ9.
dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Payload (Decoded):**

```json
{
    "sub": "550e8400-e29b-41d4-a716-446655440000", // User ID (UUID)
    "email": "annv@fpt.edu.vn",
    "role": "STUDENT", // UPPERCASE: STUDENT, TEACHER, ADMIN
    "iat": 1709123456, // Issued at (Unix timestamp)
    "exp": 1709209856 // Expires at (Unix timestamp, 24h later)
}
```

---

## 2. KIẾN TRÚC HIỆN TẠI & VẤN ĐỀ CẦN SỬA

### 2.1 Vấn đề hiện tại

| File                                  | Vấn đề                                                                | Mức độ      |
| ------------------------------------- | --------------------------------------------------------------------- | ----------- |
| `src/lib/apiFetcher/axiosInstance.js` | baseURL fallback sai (`localhost:3000` thay vì `localhost:8080`)      | 🔴 Critical |
|                                       | 401 interceptor không redirect `/auth/login`                          | 🔴 Critical |
| `src/services/AuthService.js`         | Dùng `POST /api/auth/google` (chưa triển khai ở BE)                   | 🔴 Critical |
|                                       | Method `signInWithGoogle(credential)` không tồn tại                   | 🔴 Critical |
|                                       | Lưu user JSON vào localStorage kiểu cũ                                | 🟡 Major    |
| `src/composables/useAuth.js`          | `login(credential)` gọi hàm không tồn tại                             | 🔴 Critical |
|                                       | Không decode JWT để restore state                                     | 🟡 Major    |
| `src/views/auth/LoginGoogle.vue`      | Button gọi `login()` trực tiếp thay vì redirect                       | 🔴 Critical |
| `src/router/index.js`                 | Thiếu route `/oauth2/redirect`                                        | 🔴 Critical |
|                                       | Role comparison lowercase (`'student'`) vs BE UPPERCASE (`'STUDENT'`) | 🔴 Critical |
|                                       | Tất cả protected routes có `requiresAuth: false`                      | 🔴 Critical |

### 2.2 Current Code Issues

**axiosInstance.js:**

```js
// ❌ SAI
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
    // ^^ fallback sai, BE chạy port 8080 không phải 3000
});

// 401 interceptor không làm gì
if (error.response?.status === 401) {
    console.warn('Unauthorized access detected'); // ❌ Chỉ log, không redirect
}
```

**AuthService.js:**

```js
// ❌ SAI - Endpoint không tồn tại
async signInWithGoogle(credential) {
    const data = await createResource('/auth/google', { credential });
    // ^^ POST /auth/google chưa được BE triển khai
}

// ❌ SAI - Lưu user JSON, không decode JWT
if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}
```

**useAuth.js:**

```js
// ❌ SAI - Gọi hàm không tồn tại
const login = async (credential) => {
    const data = await AuthService.signInWithGoogle(credential); // ❌ Không tồn tại
};
```

**LoginGoogle.vue:**

```js
// ❌ SAI - Gọi login() thay vì redirect
async function handleGoogleLogin() {
    try {
        await login(); // ❌ login() cần credential nhưng không có
    } catch (error) {
        console.error('Login failed:', error);
    }
}
```

**router/index.js:**

```js
// ❌ SAI - Thiếu /oauth2/redirect route
// ❌ SAI - Role comparison sai
{ path: '/student/dashboard', meta: { roles: ['student'] } }  // ❌ 'student' vs BE 'STUDENT'

// ❌ SAI - requiresAuth tắt cho protected routes
meta: { requiresAuth: false, roles: ['student'] }  // ❌ should be true
```

---

## 3. KẾ HOẠCH CHI TIẾT

### 3.1 Bước 1: Sửa `axiosInstance.js`

**Mục tiêu:**

- Đổi baseURL fallback → `http://localhost:8080/api`
- 401 interceptor → Clear token + Redirect dến `/auth/login`

**Thay đổi:**

```diff
- baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
+ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',

- if (error.response?.status === 401) {
-     console.warn('Unauthorized access detected');
- }
+ if (error.response?.status === 401) {
+     localStorage.removeItem('authToken');
+     localStorage.removeItem('authUser');
+     window.location.href = '/auth/login';
+ }
```

**Chi tiết xem:** [Bước 4.1](#41-sửa-axiosinstanejs)

---

### 3.2 Bước 2: Viết lại `AuthService.js`

**Mục tiêu:**

- Bỏ `signInWithGoogle()` (REST API không tồn tại)
- Thêm `setAuthToken(token)` - lưu JWT + set axios header
- Thêm `getUserFromToken()` - Decode JWT
- Thêm `isAuthenticated()` - Check token + expiration
- Thêm `getCurrentUser()` - GET `/api/auth/me`
- Sửa `logout()` - POST `/api/auth/logout` + clear storage

**Chi tiết xem:** [Bước 4.2](#42-viết-lại-authservicejs)

---

### 3.3 Bước 3: Viết lại `useAuth.js`

**Mục tiêu:**

- Bỏ `login(credential)` kiểu cũ
- Thêm `redirectToLogin()` - Redirect `window.location.href` đến Backend OAuth2
- Thêm `handleOAuth2Callback(token)` - Gọi từ OAuth2RedirectHandler
- Sửa `initAuth()` - Decode JWT + Restore state khi reload page
- Tất cả role refs dùng **UPPERCASE**

**Chi tiết xem:** [Bước 4.3](#43-viết-lại-useauthjs)

---

### 3.4 Bước 4: Sửa `LoginGoogle.vue`

**Mục tiêu:**

- Button click → Gọi `redirectToLogin()` từ `useAuth`

**Thay đổi:**

```diff
- async function handleGoogleLogin() {
-     await login();
- }
+ const { redirectToLogin } = useAuth();
+
+ function handleGoogleLogin() {
+     redirectToLogin();
+ }
```

**Chi tiết xem:** [Bước 4.4](#44-sửa-logingooglevue)

---

### 3.5 Bước 5: Tạo `OAuth2RedirectHandler.vue`

**Mục tiêu:**

- Component xử lý callback từ Backend redirect
- Extract `?token=` từ URL
- Save token → localStorage + axios header
- Decode role → redirect đến dashboard
- Show loading spinner

**Chi tiết xem:** [Bước 4.5](#45-tạo-oauth2redirecthandlervue)

---

### 3.6 Bước 6: Sửa `router/index.js`

**Mục tiêu:**

- Thêm `/oauth2/redirect` route
- Sửa role values → UPPERCASE
- Bật `requiresAuth: true` cho protected routes

**Thay đổi:**

```diff
+ {
+     path: '/oauth2/redirect',
+     name: 'oauth2Redirect',
+     component: () => import('@/views/auth/OAuth2RedirectHandler.vue')
+ },

- meta: { requiresAuth: false, roles: ['student'] }
+ meta: { requiresAuth: true, roles: ['STUDENT'] }
```

**Chi tiết xem:** [Bước 4.6](#46-sửa-routerindexjs)

---

## 4. TRIỂN KHAI TỪNG FILE

### 4.1 Sửa `axiosInstance.js`

**File:** `src/lib/apiFetcher/axiosInstance.js`

**Thay đổi:**

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // ✅ FIXED: port 8080
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
            // ✅ FIXED: Handle 401 - Clear token + Redirect to login
            console.warn('Unauthorized - token expired or invalid');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
```

**Key Points:**

- ✅ `baseURL` fallback: `http://localhost:8080/api` (backend runs on 8080)
- ✅ 401 interceptor clears storage + redirects

---

### 4.2 Viết lại `AuthService.js`

**File:** `src/services/AuthService.js`

**Thay thế toàn bộ bằng:**

```javascript
import axiosInstance from '@/lib/apiFetcher/axiosInstance';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

const AuthService = {
    /**
     * Set JWT token - save to localStorage + set axios header
     * Called from OAuth2RedirectHandler after backend redirects
     */
    setAuthToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    /**
     * Get JWT token from localStorage
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Clear auth data from localStorage and axios headers
     */
    clearAuthData() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        delete axiosInstance.defaults.headers.common['Authorization'];
    },

    /**
     * Decode JWT token to extract user info (userId, email, role)
     * Note: Do NOT validate signature on client side
     * Backend will verify when using token
     */
    getUserFromToken() {
        const token = this.getToken();
        if (!token) return null;

        try {
            // Extract and decode payload (part 2 of JWT)
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                userId: payload.sub, // UUID from Spring 'sub' claim
                email: payload.email,
                role: payload.role // UPPERCASE: STUDENT, TEACHER, ADMIN
            };
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    },

    /**
     * Check if token is valid and not expired
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000; // Convert to seconds
            return payload.exp > now; // Check expiration
        } catch (error) {
            console.error('Failed to validate token:', error);
            return false;
        }
    },

    /**
     * Fetch current user info from /api/auth/me
     * Returns UserResponse from backend
     */
    async getCurrentUser() {
        try {
            const response = await axiosInstance.get('/auth/me');

            // Check ApiResponse wrapper
            if (response.data.success) {
                return response.data.data; // Extract actual UserResponse
            } else {
                throw new Error(response.data.error || 'Failed to fetch user');
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    },

    /**
     * Logout - call backend endpoint + clear auth data
     */
    async logout() {
        try {
            const response = await axiosInstance.post('/auth/logout');
            if (response.data.success) {
                console.log(response.data.message); // "Logged out successfully"
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear auth data even if request fails
            this.clearAuthData();
        }
    }
};

export default AuthService;
```

**Key Points:**

- ✅ `setAuthToken(token)` - Lưu JWT + Set axios header
- ✅ `getUserFromToken()` - Decode JWT đã lưu
- ✅ `isAuthenticated()` - Check token + expiration
- ✅ `getCurrentUser()` - Call `/api/auth/me`, extract from `ApiResponse<T>`
- ✅ `logout()` - Call backend + clear storage
- ❌ `signInWithGoogle()` - Bỏ (REST API không tồn tại)
- ❌ `refreshToken()` - Bỏ (không cần)

---

### 4.3 Viết lại `useAuth.js`

**File:** `src/composables/useAuth.js`

**Thay thế toàn bộ bằng:**

```javascript
import AuthService from '@/services/AuthService';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Module-level reactive state (shared across all components using useAuth)
const user = ref(null);
const isAuthenticated = ref(false);
const userRole = ref(null);
const loading = ref(false);
const error = ref('');

export function useAuth() {
    const router = useRouter();

    /**
     * Initialize auth state from stored token
     * Called on app startup to restore user session
     */
    const initAuth = () => {
        const token = AuthService.getToken();

        if (token && AuthService.isAuthenticated()) {
            // Token exists and is valid
            const userInfo = AuthService.getUserFromToken();
            if (userInfo) {
                user.value = userInfo;
                isAuthenticated.value = true;
                userRole.value = userInfo.role; // UPPERCASE: STUDENT, TEACHER, ADMIN
            }
        } else {
            // Token missing or expired
            isAuthenticated.value = false;
            user.value = null;
            userRole.value = null;
        }
    };

    /**
     * Redirect to Google OAuth2 login page on backend
     * Backend handles all OAuth2 flow
     */
    const redirectToLogin = () => {
        // Redirect to backend OAuth2 authorization endpoint
        // Backend will handle Google OAuth2 and redirect back to /oauth2/redirect?token=...
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
        // In production, use env variable:
        // window.location.href = `${import.meta.env.VITE_BACKEND_URL}/oauth2/authorization/google`;
    };

    /**
     * Handle OAuth2 callback after backend redirects with token
     * Called from OAuth2RedirectHandler component
     * @param {string} token - JWT token from URL query parameter
     */
    const handleOAuth2Callback = (token) => {
        try {
            if (!token) {
                throw new Error('No token received');
            }

            // Save token to localStorage and set axios header
            AuthService.setAuthToken(token);

            // Decode token to get user info
            const userInfo = AuthService.getUserFromToken();
            if (!userInfo) {
                throw new Error('Invalid token - cannot decode user info');
            }

            // Update composable state
            user.value = userInfo;
            isAuthenticated.value = true;
            userRole.value = userInfo.role; // UPPERCASE: STUDENT, TEACHER, ADMIN
            error.value = '';

            return userInfo;
        } catch (err) {
            console.error('OAuth2 callback error:', err);
            error.value = err.message;
            isAuthenticated.value = false;
            user.value = null;
            userRole.value = null;
            throw err;
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            loading.value = true;
            await AuthService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Clear state regardless of success/failure
            user.value = null;
            isAuthenticated.value = false;
            userRole.value = null;
            loading.value = false;

            // Redirect to login page
            router.push({ name: 'login' });
        }
    };

    /**
     * Check if current user has a specific role
     * @param {string} role - UPPERCASE role name: 'STUDENT', 'TEACHER', 'ADMIN'
     * @returns {boolean}
     */
    const hasRole = (role) => {
        return userRole.value === role;
    };

    /**
     * Get current user info
     */
    const getCurrentUser = () => {
        return user.value;
    };

    // Initialize auth state on first composable use
    if (!user.value && !isAuthenticated.value) {
        initAuth();
    }

    return {
        // State
        user,
        isAuthenticated,
        userRole,
        loading,
        error,

        // Methods
        initAuth,
        redirectToLogin,
        handleOAuth2Callback,
        logout,
        hasRole,
        getCurrentUser,

        // Computed (optional for convenience)
        userEmail: computed(() => user.value?.email),
        userId: computed(() => user.value?.userId)
    };
}
```

**Key Points:**

- ✅ `redirectToLogin()` - Redirect window.location.href
- ✅ `handleOAuth2Callback(token)` - Process token from OAuth2RedirectHandler
- ✅ `initAuth()` - Restore state from localStorage on app startup
- ✅ Role values **UPPERCASE**: `STUDENT`, `TEACHER`, `ADMIN`
- ✅ Module-level state maintained across all usages
- ❌ `login(credential)` - Bỏ (OAuth2 redirect flow, bukan REST API)

---

### 4.4 Sửa `LoginGoogle.vue`

**File:** `src/views/auth/LoginGoogle.vue`

**Thay đổi:**

```vue
<script setup>
import { useAuth } from '@/composables/useAuth';

const { redirectToLogin, loading } = useAuth();

function handleGoogleLogin() {
    // Simply redirect to backend OAuth2 endpoint
    redirectToLogin();
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-8 w-16 shrink-0 mx-auto">
                            <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467ZM33.3284 11.4538C31.6493 10.2396 29.5855 9.52381 27.3546 9.52381C25.1195 9.52381 23.0524 10.2421 21.3717 11.4603C20.0078 11.3232 18.6475 11.1387 17.2933 10.907C19.7453 8.11308 23.3438 6.34921 27.3546 6.34921C31.36 6.34921 34.9543 8.10844 37.4061 10.896C36.0521 11.1292 34.692 11.3152 33.3284 11.4538ZM43.826 18.0518C43.881 18.6003 43.9091 19.1566 43.9091 19.7194C43.9091 28.8568 36.4973 36.2642 27.3546 36.2642C18.2117 36.2642 10.8 28.8568 10.8 19.7194C10.8 19.1615 10.8276 18.61 10.8816 18.0663L7.75383 17.4411C7.66775 18.1886 7.62354 18.9488 7.62354 19.7194C7.62354 30.6102 16.4574 39.4388 27.3546 39.4388C38.2517 39.4388 47.0855 30.6102 47.0855 19.7194C47.0855 18.9439 47.0407 18.1789 46.9536 17.4267L43.826 18.0518ZM44.2613 9.54743L40.9084 10.2176C37.9134 5.95821 32.9593 3.1746 27.3546 3.1746C21.7442 3.1746 16.7856 5.96385 13.7915 10.2305L10.4399 9.56057C13.892 3.83178 20.1756 0 27.3546 0C34.5281 0 40.8075 3.82591 44.2613 9.54743Z"
                                fill="var(--primary-color)"
                            />
                        </svg>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">FPT Certificate System</div>
                        <span class="text-muted-color font-medium">Đăng nhập để tiếp tục</span>
                    </div>

                    <div class="flex flex-col items-center gap-4">
                        <Button label="Đăng nhập với Google" icon="pi pi-google" class="w-full md:w-[30rem]" :loading="loading" @click="handleGoogleLogin" />
                        <span class="text-muted-color text-sm">Chỉ hỗ trợ email @fpt.edu.vn</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
```

**Key Points:**

- ✅ `handleGoogleLogin()` gọi `redirectToLogin()` từ useAuth
- ✅ Không cần `credential` parameter
- ✅ Tất cả logic chuyển sang OAuth2RedirectHandler

---

### 4.5 Tạo `OAuth2RedirectHandler.vue`

**File:** `src/views/auth/OAuth2RedirectHandler.vue` (NEW FILE)

**Nội dung:**

```vue
<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { handleOAuth2Callback } = useAuth();

onMounted(() => {
    // Extract token from URL query parameter (?token=...)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        // No token in URL - redirect to login
        console.error('No token in OAuth2 redirect URL');
        router.push({ name: 'login' });
        return;
    }

    try {
        // Process token: save, decode, update state
        const userInfo = handleOAuth2Callback(token);

        // Redirect based on role
        if (userInfo.role === 'STUDENT') {
            router.push({ name: 'studentDashboard' });
        } else if (userInfo.role === 'TEACHER') {
            router.push({ name: 'teacherDashboard' });
        } else if (userInfo.role === 'ADMIN') {
            router.push({ name: 'adminDashboard' });
        } else {
            // Unknown role - redirect to login
            console.error('Unknown user role:', userInfo.role);
            router.push({ name: 'login' });
        }
    } catch (error) {
        console.error('Failed to process OAuth2 callback:', error);
        router.push({ name: 'login' });
    }
});
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <div class="text-center">
            <div class="flex justify-center mb-4">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900">
                    <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
                </div>
            </div>
            <h2 class="text-2xl font-semibold mb-2">Đang xử lý đăng nhập...</h2>
            <p class="text-muted-color">Vui lòng chờ trong giây lát</p>
        </div>
    </div>
</template>

<style scoped>
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.pi-spin {
    animation: spin 1s linear infinite;
}
</style>
```

**Key Points:**

- ✅ Extract token từ URL query parameter
- ✅ Gọi `handleOAuth2Callback(token)` từ useAuth
- ✅ Redirect dựa trên role (UPPERCASE comparison)
- ✅ Show loading spinner
- ✅ Error handling: redirect to login if fails

---

### 4.6 Sửa `router/index.js`

**File:** `src/router/index.js`

**Thay đổi chính:**

```javascript
import { useAuth } from '@/composables/useAuth';
import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Auth routes (outside AppLayout)
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/auth/LoginGoogle.vue'),
            meta: { requiresAuth: false }
        },
        // ✅ NEW: OAuth2 redirect handler
        {
            path: '/oauth2/redirect',
            name: 'oauth2Redirect',
            component: () => import('@/views/auth/OAuth2RedirectHandler.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/templates/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/templates/pages/auth/Error.vue')
        },

        // Main app layout (with sidebar, topbar)
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/templates/Dashboard.vue')
                },

                // Student routes
                {
                    path: '/student/dashboard',
                    name: 'studentDashboard',
                    component: () => import('@/views/student/StudentDashboard.vue'),
                    meta: { requiresAuth: true, roles: ['STUDENT'] } // ✅ FIXED: UPPERCASE + requiresAuth: true
                },
                {
                    path: '/student/course/:id',
                    name: 'courseDetail',
                    component: () => import('@/views/student/CourseDetail.vue'),
                    meta: { requiresAuth: true, roles: ['STUDENT'] } // ✅ FIXED
                },

                // Teacher routes
                {
                    path: '/teacher/dashboard',
                    name: 'teacherDashboard',
                    component: () => import('@/views/teacher/TeacherDashboard.vue'),
                    meta: { requiresAuth: true, roles: ['TEACHER'] } // ✅ FIXED: UPPERCASE + requiresAuth: true
                },
                {
                    path: '/teacher/class/:id',
                    name: 'classDetail',
                    component: () => import('@/views/teacher/ClassDetail.vue'),
                    meta: { requiresAuth: true, roles: ['TEACHER'] } // ✅ FIXED
                },
                {
                    path: '/teacher/quiz/:classId',
                    name: 'quizManagement',
                    component: () => import('@/views/teacher/QuizManagement.vue'),
                    meta: { requiresAuth: true, roles: ['TEACHER'] } // ✅ FIXED
                },

                // Admin routes
                {
                    path: '/admin/dashboard',
                    name: 'adminDashboard',
                    component: () => import('@/views/admin/AdminDashboard.vue'),
                    meta: { requiresAuth: true, roles: ['ADMIN'] } // ✅ FIXED: UPPERCASE + requiresAuth: true
                },
                {
                    path: '/admin/certificate/:id',
                    name: 'certificateDetail',
                    component: () => import('@/views/admin/CertificateManagement.vue'),
                    meta: { requiresAuth: true, roles: ['ADMIN'] } // ✅ FIXED
                },

                // Template routes (kept for reference/development)
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/templates/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/templates/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/templates/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/templates/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/templates/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/templates/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/templates/uikit/PanelsDoc.vue')
                },
                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/templates/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/templates/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/templates/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/templates/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/templates/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/templates/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/templates/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/templates/uikit/TimelineDoc.vue')
                },
                {
                    path: '/blocks/free',
                    name: 'blocks',
                    meta: {
                        breadcrumb: ['Prime Blocks', 'Free Blocks']
                    },
                    component: () => import('@/templates/utilities/Blocks.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/templates/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/templates/pages/Crud.vue')
                },
                {
                    path: '/start/documentation',
                    name: 'documentation',
                    component: () => import('@/templates/pages/Documentation.vue')
                }
            ]
        },

        // Other routes
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/templates/pages/Landing.vue')
        },

        // 404 route
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import('@/templates/pages/NotFound.vue')
        }
    ]
});

// Navigation guard for authentication and role-based access control
router.beforeEach((to, from, next) => {
    const auth = useAuth();
    const requiresAuth = to.meta.requiresAuth ?? false;
    const requiredRoles = to.meta.roles || [];

    if (requiresAuth) {
        // Route requires authentication
        if (!auth.isAuthenticated.value) {
            // User not authenticated - redirect to login
            next({ name: 'login' });
            return;
        }

        // Check role-based access
        if (requiredRoles.length > 0 && !requiredRoles.includes(auth.userRole.value)) {
            // User doesn't have required role - redirect to access denied page
            next({ name: 'accessDenied' });
            return;
        }
    }

    next();
});

export default router;
```

**Key Points:**

- ✅ Thêm `/oauth2/redirect` route
- ✅ Tất cả protected routes: `requiresAuth: true`
- ✅ Role values **UPPERCASE**: `STUDENT`, `TEACHER`, `ADMIN`
- ✅ Navigation guard check roles UPPERCASE

---

## 5. TESTING & VERIFICATION

### 5.1 Unit Test Checklist

**Test 1: axiosInstance.js**

```javascript
// Test 1.1: baseURL correct
import axiosInstance from '@/lib/apiFetcher/axiosInstance';
console.log(axiosInstance.defaults.baseURL); // Should be: http://localhost:8080/api

// Test 1.2: 401 intercept handling
// (Can't easily test in browser without actual 401 response)
```

**Test 2: AuthService.js**

```javascript
import AuthService from '@/services/AuthService';

// Test 2.1: setAuthToken + getToken
AuthService.setAuthToken('test-token-12345');
console.log(AuthService.getToken()); // Should output: test-token-12345

// Test 2.2: getUserFromToken
const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFubnZAZnB0LmVkdS52biIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzA5MTIzNDU2LCJleHAiOjE3MDkyMDk4NTZ9.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
AuthService.setAuthToken(mockToken);
const user = AuthService.getUserFromToken();
console.log(user); // Should output: { userId: '550e8400-...', email: 'annv@fpt.edu.vn', role: 'STUDENT' }

// Test 2.3: isAuthenticated
console.log(AuthService.isAuthenticated()); // Should be: true (if token not expired)

// Test 2.4: clearAuthData
AuthService.clearAuthData();
console.log(AuthService.getToken()); // Should be: null
```

**Test 3: useAuth.js**

```javascript
import { useAuth } from '@/composables/useAuth';

const auth = useAuth();

// Test 3.1: Initial state
console.log(auth.isAuthenticated.value); // Should be: false
console.log(auth.userRole.value); // Should be: null

// Test 3.2: handleOAuth2Callback
const token = 'eyJhbGc...'; // Valid JWT token
auth.handleOAuth2Callback(token);
console.log(auth.isAuthenticated.value); // Should be: true
console.log(auth.userRole.value); // Should be: 'STUDENT' (UPPERCASE)
```

### 5.2 Integration Test - Full OAuth2 Flow

**Step-by-step test:**

1. **Start Backend:**

    ```bash
    cd backend
    ./mvnw spring-boot:run
    # Backend runs on http://localhost:8080
    ```

2. **Start Frontend:**

    ```bash
    npm run dev
    # Frontend runs on http://localhost:5173 (or 3000)
    ```

3. **Open Login Page:**

    ```
    http://localhost:5173/auth/login
    ```

4. **Click "Đăng nhập với Google":**
    - Should redirect to: `http://localhost:8080/oauth2/authorization/google`
    - Google login popup appears

5. **Login with Google Account:**
    - Use test Google account (e.g., with @fpt.edu.vn email)
    - Authorize application

6. **Verify Redirect:**
    - Backend should redirect to: `http://localhost:3000/oauth2/redirect?token=<JWT>`
    - (OAuth2RedirectHandler component should be mounted)
    - Should show loading spinner

7. **Verify Token Processing:**
    - Open browser console:
        ```javascript
        console.log(localStorage.getItem('authToken'));
        // Should output: eyJhbGc...
        ```

8. **Verify Redirect to Dashboard:**
    - Should redirect to appropriate dashboard:
        - STUDENT → `/student/dashboard`
        - TEACHER → `/teacher/dashboard`
        - ADMIN → `/admin/dashboard`

9. **Check Axios Header:**

    ```javascript
    // In browser console
    import axiosInstance from '@/lib/apiFetcher/axiosInstance';
    console.log(axiosInstance.defaults.headers.common.Authorization);
    // Should output: Bearer <JWT>
    ```

10. **Test Protected API Call:**

    ```javascript
    import axiosInstance from '@/lib/apiFetcher/axiosInstance';
    axiosInstance
        .get('/auth/me')
        .then((res) => console.log(res.data))
        .catch((err) => console.error(err));

    // Should return:
    // { success: true, data: { userId, fullName, email, role, avatarUrl, isActive } }
    ```

### 5.3 Browser DevTools Testing

**Network Tab:**

1. Login request:

    ```
    GET http://localhost:8080/oauth2/authorization/google
    Status: 302 (Redirect)
    Location: https://accounts.google.com/...
    ```

2. OAuth2 callback:

    ```
    GET http://localhost:8080/oauth2/callback?code=...
    Status: 302 (Redirect)
    Location: http://localhost:3000/oauth2/redirect?token=eyJhbGc...
    ```

3. FE redirect handler:

    ```
    GET http://localhost:3000/oauth2/redirect?token=...
    Status: 200
    ```

4. API call after redirect:
    ```
    GET http://localhost:8080/api/auth/me
    Headers: Authorization: Bearer eyJhbGc...
    Status: 200
    Body: { success: true, data: {...} }
    ```

**Local Storage:**

```javascript
// In console
localStorage.getItem('authToken'); // JWT token
localStorage.getItem('authUser'); // Should be removed (we use JWT decode now)
```

**Application State:**

```javascript
import { useAuth } from '@/composables/useAuth';
const auth = useAuth();

console.log('isAuthenticated:', auth.isAuthenticated.value);
console.log('userRole:', auth.userRole.value); // STUDENT, TEACHER, or ADMIN
console.log('user:', auth.user.value); // Full user object
```

---

## 6. TROUBLESHOOTING

### 6.1 "CORS error: No 'Access-Control-Allow-Origin'"

**Nguyên nhân:**

- Backend chưa enable CORS cho frontend origin

**Giải pháp:**

- Check Backend `SecurityConfig.java` với CORS configuration:
    ```java
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173"));
    ```

### 6.2 "401 Unauthorized - Invalid credentials"

**Nguyên nhân:**

- Token không gửi trong header
- Token sai format
- Token đã expired

**Giải pháp:**

1. Check localStorage:
    ```javascript
    console.log(localStorage.getItem('authToken'));
    ```
2. Check axios header:
    ```javascript
    import axiosInstance from '@/lib/apiFetcher/axiosInstance';
    console.log(axiosInstance.defaults.headers.common.Authorization);
    ```
3. Decode token và check expiration:
    ```javascript
    const token = localStorage.getItem('authToken');
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Exp:', new Date(payload.exp * 1000));
    ```

### 6.3 "Role mismatch: 'student' vs 'STUDENT'"

**Nguyên nhân:**

- Router metadata dùng lowercase nhưng backend trả UPPERCASE

**Giải pháp:**

- Update router/index.js: `roles: ['STUDENT']` (UPPERCASE)

### 6.4 "Cannot redirect to dashboard - stuck on loading"

**Nguyên nhân:**

- Token format sai hoặc decode lỗi
- Role không match dashboard route

**Giải pháp:**

1. Check browser console for errors
2. Check JWT payload:
    ```javascript
    const token = localStorage.getItem('authToken');
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Role:', payload.role);
    ```
3. Verify role value is UPPERCASE

### 6.5 "Logout không hoạt động, token vẫn trong localStorage"

**Nguyên nhân:**

- `clearAuthData()` chưa được gọi

**Giải pháp:**

- Đảm bảo `config.refreshOnInit` hay `initAuth()` được gọi

---

## 📋 CHECKLIST TRIỂN KHAI

### Phase 1: Fix Core Issues (Critical)

- [ ] Fix `axiosInstance.js`
    - [ ] Đổi baseURL fallback → `http://localhost:8080/api`
    - [ ] 401 interceptor → Clear token + redirect
- [ ] Rewrite `AuthService.js`
    - [ ] Remove `signInWithGoogle()`
    - [ ] Add `setAuthToken()`, `getToken()`, `clearAuthData()`
    - [ ] Add `getUserFromToken()` (decode JWT)
    - [ ] Add `isAuthenticated()` (check expiration)
    - [ ] Add `getCurrentUser()` (GET /api/auth/me)
    - [ ] Update `logout()` (POST /api/auth/logout)
- [ ] Rewrite `useAuth.js`
    - [ ] Remove `login(credential)`
    - [ ] Add `redirectToLogin()` (window.location.href)
    - [ ] Add `handleOAuth2Callback(token)`
    - [ ] Fix `initAuth()` (JWT decode)
    - [ ] Use UPPERCASE roles
- [ ] Update `LoginGoogle.vue`
    - [ ] Change button to call `redirectToLogin()`
- [ ] Create `OAuth2RedirectHandler.vue`
    - [ ] Extract token from URL
    - [ ] Call `handleOAuth2Callback()`
    - [ ] Redirect based on role
- [ ] Update `router/index.js`
    - [ ] Add `/oauth2/redirect` route
    - [ ] Fix role values (UPPERCASE)
    - [ ] Enable `requiresAuth: true`

### Phase 2: Testing (Major)

- [ ] Test login flow end-to-end
- [ ] Test token storage + axios header
- [ ] Test protected API calls
- [ ] Test logout functionality
- [ ] Test role-based redirects
- [ ] Test 401 handling
- [ ] Test token expiration (if possible)

### Phase 3: Documentation (Minor)

- [ ] Document environment variables needed
- [ ] Document backend endpoints required
- [ ] Create troubleshooting guide
- [ ] Create developer setup guide

---

## 🎯 SUCCESS CRITERIA

✅ **Login works end-to-end:**

- Click button → Redirect to Google OAuth2
- After login → Redirect to dashboard

✅ **Token management:**

- Token stored in localStorage
- Axios header automatically set
- Token decoded for role info

✅ **Protected routes:**

- Unauthorized users redirected to login
- Role-based access control working
- Correct dashboard shown per role

✅ **API calls:**

- All requests have Authorization header
- 401 errors trigger redirect to login

✅ **No console errors:**

- All components render without errors
- Services work correctly
- Router navigation smooth

---

## 📚 RELATED DOCUMENTATION

- [API-RESPONSE-FORMAT.md](./FE%20Tutorial/API-RESPONSE-FORMAT.md) - Backend API format details
- [FE-AUTH-INTEGRATION-GUIDE.md](./FE%20Tutorial/FE-AUTH-INTEGRATION-GUIDE.md) - Detailed auth integration guide
- [FE-QUICK-START.md](./FE%20Tutorial/FE-QUICK-START.md) - 5-minute quick start
- [UPDATE-SUMMARY.md](./FE%20Tutorial/UPDATE-SUMMARY.md) - Summary of changes from backend team

---

## 📞 SUPPORT

**Issues during implementation:**

1. Check errors in browser console (F12)
2. Verify backend is running on port 8080
3. Check localStorage for token
4. Verify axios header Authorization
5. Review backend logs for API errors
6. Contact backend team if API issues

**Backend Team:**

- Email: backend-team@fpt.edu.vn
- Slack: #backend-support

---

**Happy Coding! 🚀**

_Last Updated: 2026-02-21_  
_Frontend Team Implementation Guide_
