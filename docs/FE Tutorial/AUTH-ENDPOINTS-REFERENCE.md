# 📚 HƯỚNG DẪN GỌI CÁC ENDPOINT AUTH

> **Backend Team** | Ngày cập nhật: 2026-02-22  
> **Base URL**: `http://localhost:8080`

---

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [OAuth2 Login Flow](#1-oauth2-login-flow)
3. [Lấy thông tin user hiện tại](#2-lấy-thông-tin-user-hiện-tại)
4. [Đăng xuất](#3-đăng-xuất)
5. [Kiểm tra role](#4-kiểm-tra-role)
6. [Setup Axios](#setup-axios)
7. [Ví dụ thực tế với Vue 3](#ví-dụ-thực-tế-với-vue-3)

---

## TỔNG QUAN

### Authentication Method

Backend sử dụng **JWT Bearer Token** authentication. Tất cả các protected endpoints yêu cầu header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

Tất cả các endpoint đều trả về format chuẩn:

```json
{
  "success": true/false,
  "data": { /* dữ liệu */ },
  "message": "thông báo",
  "error": "lỗi nếu có"
}
```

---

## 1. OAUTH2 LOGIN FLOW

### Bước 1: Redirect để đăng nhập

**Endpoint**: `GET /oauth2/authorization/google`

**Mô tả**: Chuyển hướng user đến trang đăng nhập Google

**Cách gọi**:

```javascript
// Trong Vue component
const handleLogin = () => {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
};
```

**Flow**:

1. Frontend redirect user đến URL này
2. User đăng nhập với Google
3. Backend xử lý và redirect về frontend với token

---

### Bước 2: Nhận token từ redirect

**Endpoint**: `GET /oauth2/redirect?token=<JWT>`

**Mô tả**: Backend sẽ redirect về URL này sau khi login thành công

**URL nhận**: `http://localhost:3000/oauth2/redirect?token=<JWT_TOKEN_HERE>`

**Cách xử lý**:

```javascript
// Trong OAuth2RedirectHandler.vue
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  // Lấy token từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    console.error("Không tìm thấy token");
    router.push("/login");
    return;
  }

  // Lưu token vào localStorage
  localStorage.setItem("authToken", token);

  // Decode JWT để lấy thông tin user
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("User info:", payload);

    // payload chứa:
    // - sub: userId
    // - email: user email
    // - role: STUDENT/TEACHER/ADMIN
    // - exp: thời gian hết hạn (timestamp)

    // Redirect dựa trên role
    switch (payload.role) {
      case "STUDENT":
        router.push("/student/dashboard");
        break;
      case "TEACHER":
        router.push("/teacher/dashboard");
        break;
      case "ADMIN":
        router.push("/admin/dashboard");
        break;
      default:
        router.push("/dashboard");
    }
  } catch (error) {
    console.error("Lỗi decode token:", error);
    router.push("/login");
  }
});
```

**JWT Payload Structure**:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "student@fpt.edu.vn",
  "role": "STUDENT",
  "iat": 1708617600,
  "exp": 1708704000
}
```

---

## 2. LẤY THÔNG TIN USER HIỆN TẠI

### GET /api/auth/me

**Mô tả**: Lấy thông tin chi tiết của user đang đăng nhập

**Authentication**: ✅ Required (Bearer Token)

**Request**:

```http
GET /api/auth/me HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:

```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Nguyễn Văn An",
    "email": "annv@fpt.edu.vn",
    "role": "STUDENT",
    "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocI...",
    "isActive": true
  },
  "message": null,
  "error": null
}
```

**Response Error (401 Unauthorized)**:

```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "Invalid credentials"
}
```

**Response Error (403 Forbidden)**:

```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "Access Denied"
}
```

### Cách gọi với Axios

#### Cách 1: Gọi trực tiếp

```javascript
import axios from "axios";

const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem("authToken");

    const response = await axios.get("http://localhost:8080/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      console.log("User:", response.data.data);
      return response.data.data;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    console.error("Error:", error.response?.data?.error);
    throw error;
  }
};

// Sử dụng
getCurrentUser().then((user) => {
  console.log("Logged in as:", user.fullName);
});
```

#### Cách 2: Sử dụng Axios Instance (Recommend)

```javascript
// api/axios.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
});

// Tự động thêm token vào mọi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý lỗi 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
```

```javascript
// api/auth.js
import axiosInstance from "./axios";

export const authAPI = {
  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data.data; // Trả về data bên trong
  },
};
```

```javascript
// Trong component
import { authAPI } from "@/api/auth";

const loadUser = async () => {
  try {
    const user = await authAPI.getCurrentUser();
    console.log("User:", user);
  } catch (error) {
    console.error("Failed to load user:", error);
  }
};
```

### Composition API Hook (Vue 3)

```javascript
// composables/useAuth.js
import { ref } from "vue";
import { authAPI } from "@/api/auth";

export function useAuth() {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchCurrentUser = async () => {
    loading.value = true;
    error.value = null;

    try {
      user.value = await authAPI.getCurrentUser();
    } catch (err) {
      error.value = err.response?.data?.error || "Không thể lấy thông tin user";
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    error,
    fetchCurrentUser,
  };
}
```

```vue
<!-- Trong component -->
<script setup>
import { onMounted } from "vue";
import { useAuth } from "@/composables/useAuth";

const { user, loading, error, fetchCurrentUser } = useAuth();

onMounted(async () => {
  await fetchCurrentUser();
});
</script>

<template>
  <div v-if="loading">Đang tải...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else-if="user">
    <h2>Xin chào, {{ user.fullName }}</h2>
    <p>Email: {{ user.email }}</p>
    <p>Role: {{ user.role }}</p>
    <img :src="user.avatarUrl" alt="Avatar" />
  </div>
</template>
```

---

## 3. ĐĂNG XUẤT

### POST /api/auth/logout

**Mô tả**: Đăng xuất user (JWT là stateless nên chỉ cần xóa token ở client)

**Authentication**: ✅ Required (Bearer Token)

**Request**:

```http
POST /api/auth/logout HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:

```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully",
  "error": null
}
```

### Cách gọi với Axios

```javascript
// api/auth.js
import axiosInstance from "./axios";

export const authAPI = {
  logout: async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  },
};
```

```javascript
// Trong component
import { useRouter } from "vue-router";
import { authAPI } from "@/api/auth";

const router = useRouter();

const handleLogout = async () => {
  try {
    // Gọi API logout
    await authAPI.logout();

    // Xóa token khỏi localStorage
    localStorage.removeItem("authToken");

    // Redirect về trang login
    router.push("/login");

    console.log("Đăng xuất thành công");
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    // Vẫn xóa token và redirect nếu có lỗi
    localStorage.removeItem("authToken");
    router.push("/login");
  }
};
```

### Component hoàn chỉnh (Vue 3)

```vue
<script setup>
import { useRouter } from "vue-router";
import { authAPI } from "@/api/auth";

const router = useRouter();
const isLoggingOut = ref(false);

const handleLogout = async () => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;

  try {
    await authAPI.logout();
    localStorage.removeItem("authToken");
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
    localStorage.removeItem("authToken");
    router.push("/login");
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<template>
  <button @click="handleLogout" :disabled="isLoggingOut">
    {{ isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất" }}
  </button>
</template>
```

---

## 4. KIỂM TRA ROLE

### GET /api/auth/check-role

**Mô tả**: Endpoint để kiểm tra role của user hiện tại (dùng cho testing hoặc debugging)

**Authentication**: ✅ Required (Bearer Token)

**Allowed Roles**: STUDENT, TEACHER, ADMIN

**Request**:

```http
GET /api/auth/check-role HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:

```json
{
  "success": true,
  "data": null,
  "message": "You are logged in as: STUDENT",
  "error": null
}
```

**Response Error (403 Forbidden)**:

```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "Access Denied"
}
```

### Cách gọi với Axios

```javascript
// api/auth.js
export const authAPI = {
  checkRole: async () => {
    const response = await axiosInstance.get("/auth/check-role");
    return response.data;
  },
};
```

```javascript
// Trong component
import { authAPI } from "@/api/auth";

const checkMyRole = async () => {
  try {
    const result = await authAPI.checkRole();
    console.log(result.message); // "You are logged in as: STUDENT"
  } catch (error) {
    if (error.response?.status === 403) {
      console.error("Bạn không có quyền truy cập");
    }
  }
};
```

---

## SETUP AXIOS

### File Structure

```
src/
├── api/
│   ├── axios.js          # Axios instance config
│   └── auth.js           # Auth API functions
├── composables/
│   └── useAuth.js        # Auth composable
└── router/
    └── index.js          # Router with auth guard
```

### 1. Cấu hình Axios Instance

```javascript
// src/api/axios.js
import axios from "axios";
import router from "@/router";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - Tự động thêm token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor - Xử lý lỗi chung
axiosInstance.interceptors.response.use(
  (response) => {
    // Nếu backend trả về ApiResponse wrapper
    if (response.data?.success === false) {
      console.error("API Error:", response.data.error);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;

    switch (status) {
      case 401:
        // Token hết hạn hoặc không hợp lệ
        console.error("Phiên đăng nhập hết hạn");
        localStorage.removeItem("authToken");
        router.push("/login");
        break;

      case 403:
        // Không có quyền
        console.error("Bạn không có quyền truy cập");
        router.push("/forbidden");
        break;

      case 404:
        console.error("Không tìm thấy tài nguyên");
        break;

      case 500:
        console.error("Lỗi server");
        break;

      default:
        console.error("Lỗi không xác định:", error.message);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
```

### 2. Auth API Functions

```javascript
// src/api/auth.js
import axiosInstance from "./axios";

export const authAPI = {
  /**
   * Lấy thông tin user hiện tại
   * @returns {Promise<UserResponse>}
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data.data;
  },

  /**
   * Đăng xuất
   * @returns {Promise<ApiResponse>}
   */
  logout: async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  },

  /**
   * Kiểm tra role
   * @returns {Promise<ApiResponse>}
   */
  checkRole: async () => {
    const response = await axiosInstance.get("/auth/check-role");
    return response.data;
  },

  /**
   * Kiểm tra token có hợp lệ không
   * @returns {boolean}
   */
  isAuthenticated: () => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    try {
      // Decode JWT
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Kiểm tra expiration
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  },

  /**
   * Lấy user info từ token (không gọi API)
   * @returns {Object|null}
   */
  getUserFromToken: () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  },
};
```

### 3. Auth Composable (Khuyến nghị)

```javascript
// src/composables/useAuth.js
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { authAPI } from "@/api/auth";

const user = ref(null);
const loading = ref(false);
const error = ref(null);

export function useAuth() {
  const router = useRouter();

  // Computed properties
  const isAuthenticated = computed(() => authAPI.isAuthenticated());
  const isStudent = computed(() => user.value?.role === "STUDENT");
  const isTeacher = computed(() => user.value?.role === "TEACHER");
  const isAdmin = computed(() => user.value?.role === "ADMIN");

  // Lấy thông tin user
  const fetchCurrentUser = async () => {
    loading.value = true;
    error.value = null;

    try {
      user.value = await authAPI.getCurrentUser();
      return user.value;
    } catch (err) {
      error.value = err.response?.data?.error || "Không thể lấy thông tin user";
      user.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Đăng nhập (redirect to Google)
  const login = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  // Đăng xuất
  const logout = async () => {
    loading.value = true;

    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("authToken");
      user.value = null;
      loading.value = false;
      router.push("/login");
    }
  };

  // Initialize user from token
  const initUser = () => {
    const userFromToken = authAPI.getUserFromToken();
    if (userFromToken) {
      // Có thể set user từ token hoặc fetch từ API
      fetchCurrentUser();
    }
  };

  return {
    // State
    user,
    loading,
    error,

    // Computed
    isAuthenticated,
    isStudent,
    isTeacher,
    isAdmin,

    // Methods
    fetchCurrentUser,
    login,
    logout,
    initUser,
  };
}
```

### 4. Router Guard

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { authAPI } from "@/api/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/oauth2/redirect",
      name: "OAuth2Redirect",
      component: () => import("@/views/OAuth2RedirectHandler.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/student/dashboard",
      name: "StudentDashboard",
      component: () => import("@/views/student/Dashboard.vue"),
      meta: { requiresAuth: true, roles: ["STUDENT"] },
    },
    {
      path: "/teacher/dashboard",
      name: "TeacherDashboard",
      component: () => import("@/views/teacher/Dashboard.vue"),
      meta: { requiresAuth: true, roles: ["TEACHER"] },
    },
    {
      path: "/admin/dashboard",
      name: "AdminDashboard",
      component: () => import("@/views/admin/Dashboard.vue"),
      meta: { requiresAuth: true, roles: ["ADMIN"] },
    },
  ],
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const requiredRoles = to.meta.roles;
  const isAuthenticated = authAPI.isAuthenticated();

  if (requiresAuth && !isAuthenticated) {
    // Chưa đăng nhập, redirect về login
    next("/login");
    return;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userInfo = authAPI.getUserFromToken();

    if (!userInfo || !requiredRoles.includes(userInfo.role)) {
      // Không có quyền truy cập
      next("/forbidden");
      return;
    }
  }

  next();
});

export default router;
```

---

## VÍ DỤ THỰC TẾ VỚI VUE 3

### 1. Login Page

```vue
<!-- src/views/LoginPage.vue -->
<script setup>
import { useAuth } from "@/composables/useAuth";

const { login, isAuthenticated } = useAuth();

// Nếu đã login, redirect về dashboard
if (isAuthenticated.value) {
  const userInfo = authAPI.getUserFromToken();
  window.location.href = `/${userInfo.role.toLowerCase()}/dashboard`;
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Đăng nhập hệ thống</h1>
      <p>Sử dụng tài khoản Google để đăng nhập</p>

      <button @click="login" class="google-login-btn">
        <img src="/google-icon.svg" alt="Google" />
        Đăng nhập với Google
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
}

.google-login-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.google-login-btn:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.google-login-btn img {
  width: 20px;
  height: 20px;
}
</style>
```

### 2. OAuth2 Redirect Handler

```vue
<!-- src/views/OAuth2RedirectHandler.vue -->
<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const error = urlParams.get("error");

  if (error) {
    console.error("OAuth2 Error:", error);
    router.push({
      path: "/login",
      query: { error: "Đăng nhập thất bại" },
    });
    return;
  }

  if (!token) {
    console.error("No token found");
    router.push("/login");
    return;
  }

  try {
    // Lưu token
    localStorage.setItem("authToken", token);

    // Decode để lấy role
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Login successful:", payload);

    // Redirect theo role
    const roleRoutes = {
      STUDENT: "/student/dashboard",
      TEACHER: "/teacher/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const route = roleRoutes[payload.role] || "/dashboard";
    router.push(route);
  } catch (error) {
    console.error("Token decode error:", error);
    router.push("/login");
  }
});
</script>

<template>
  <div class="redirect-handler">
    <div class="spinner"></div>
    <p>Đang xử lý đăng nhập...</p>
  </div>
</template>

<style scoped>
.redirect-handler {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
```

### 3. Dashboard với User Info

```vue
<!-- src/views/student/Dashboard.vue -->
<script setup>
import { onMounted } from "vue";
import { useAuth } from "@/composables/useAuth";

const { user, loading, error, fetchCurrentUser, logout } = useAuth();

onMounted(async () => {
  await fetchCurrentUser();
});
</script>

<template>
  <div class="dashboard">
    <nav class="navbar">
      <h1>Student Dashboard</h1>
      <button @click="logout" class="logout-btn">Đăng xuất</button>
    </nav>

    <div class="content">
      <!-- Loading State -->
      <div v-if="loading" class="loading">Đang tải thông tin...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <!-- User Info -->
      <div v-else-if="user" class="user-info">
        <img :src="user.avatarUrl" :alt="user.fullName" class="avatar" />
        <h2>Xin chào, {{ user.fullName }}</h2>
        <p>Email: {{ user.email }}</p>
        <p>Role: {{ user.role }}</p>
        <p>User ID: {{ user.userId }}</p>
        <p>
          Status:
          <span :class="user.isActive ? 'active' : 'inactive'">
            {{ user.isActive ? "Active" : "Inactive" }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.content {
  padding: 2rem;
}

.user-info {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.active {
  color: #28a745;
  font-weight: bold;
}

.inactive {
  color: #dc3545;
  font-weight: bold;
}
</style>
```

### 4. App.vue với Auto Login

```vue
<!-- src/App.vue -->
<script setup>
import { onMounted } from "vue";
import { useAuth } from "@/composables/useAuth";

const { initUser } = useAuth();

onMounted(() => {
  // Initialize user khi app load
  initUser();
});
</script>

<template>
  <router-view />
</template>
```

---

## ❌ XỬ LÝ LỖI THƯỜNG GẶP

### 1. Token không hợp lệ (401)

```javascript
// Khi nhận 401, xóa token và redirect về login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### 2. CORS Error

Nếu gặp CORS error khi gọi API:

```
Access to XMLHttpRequest at 'http://localhost:8080/api/auth/me'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Giải pháp**: Backend đã config CORS cho `http://localhost:3000`. Đảm bảo frontend chạy đúng port.

### 3. Token hết hạn

```javascript
// Check token expiration trước khi gọi API
const isTokenExpired = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
};

// Sử dụng
if (isTokenExpired()) {
  // Redirect về login
  window.location.href = "/login";
}
```

### 4. Không có quyền (403)

```javascript
try {
  await authAPI.checkRole();
} catch (error) {
  if (error.response?.status === 403) {
    alert("Bạn không có quyền truy cập tính năng này");
    router.push("/dashboard");
  }
}
```

---

## 🔒 SECURITY BEST PRACTICES

### 1. Không log token ra console

```javascript
// ❌ KHÔNG LÀM NHƯ VẦY
console.log("Token:", localStorage.getItem("authToken"));

// ✅ LÀM NHƯ VẦY (chỉ log khi dev)
if (import.meta.env.DEV) {
  console.log("Token exists:", !!localStorage.getItem("authToken"));
}
```

### 2. Validate token trước khi sử dụng

```javascript
const getToken = () => {
  const token = localStorage.getItem("authToken");

  if (!token) return null;

  try {
    // Validate format
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      localStorage.removeItem("authToken");
      return null;
    }

    return token;
  } catch {
    localStorage.removeItem("authToken");
    return null;
  }
};
```

### 3. Clear token khi logout

```javascript
const logout = async () => {
  try {
    await authAPI.logout();
  } finally {
    // Luôn clear token dù API có lỗi
    localStorage.removeItem("authToken");
    sessionStorage.clear(); // Clear all session data
    window.location.href = "/login";
  }
};
```

### 4. Sử dụng HTTPS trong production

```javascript
// .env.production
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## 📝 CHECKLIST TRIỂN KHAI

- [x] Setup axios instance với interceptors
- [x] Tạo auth API functions
- [x] Tạo useAuth composable
- [x] Setup router guards
- [x] Tạo LoginPage component
- [x] Tạo OAuth2RedirectHandler component
- [ ] Test login flow hoàn chỉnh
- [x] Test logout functionality
- [x] Test protected routes
- [x] Test role-based access
- [x] Handle error cases (401, 403, 500)
- [ ] Test token expiration
- [ ] Verify CORS configuration
- [ ] Test trên nhiều browsers

---

## 🔗 LIÊN KẾT THAM KHẢO

- [FE-AUTH-INTEGRATION-GUIDE.md](./FE-AUTH-INTEGRATION-GUIDE.md) - Hướng dẫn chi tiết về OAuth2 flow
- [API-RESPONSE-FORMAT.md](./API-RESPONSE-FORMAT.md) - Format response của API
- [FE-QUICK-START.md](./FE-QUICK-START.md) - Quick start guide

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, liên hệ Backend Team hoặc tạo issue trên repository.

**Backend Base URL**: `http://localhost:8080`  
**Frontend Redirect URL**: `http://localhost:3000/oauth2/redirect`  
**JWT Expiration**: 24 giờ
