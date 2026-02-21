# 📋 Hướng Dẫn Chi Tiết: Backend Redirect + Frontend Xử Lý

> **Ngày**: 2026-02-21  
> **Mục đích**: Chi tiết từng bước cách Backend redirect và Frontend xử lý OAuth2 callback dựa trên cấu hình router đã sẵn có

---

## 🎯 OVERVIEW

Dựa trên `src/router/index.js` đã cấu hình:

✅ Route `/oauth2/redirect` đã tồn tại (public, không cần auth)  
✅ Routes dashboard theo role: `/student/dashboard`, `/teacher/dashboard`, `/admin/dashboard`  
✅ Role guards đã setup (UPPERCASE: STUDENT, TEACHER, ADMIN)

**Nhiệm vụ này**: Hướng dẫn Backend redirect chính xác + Frontend xử lý callback

---

## 🔄 LUỒNG HOÀN CHỈNH

```
1️⃣  FE: User clicks "Đăng nhập với Google"
         └─ window.location.href = "http://localhost:8080/oauth2/authorization/google"

2️⃣  BE: Spring Security OAuth2
         └─ Redirect → Google login page (user enters credentials)

3️⃣  BE: Google OAuth2 Callback
         URL: http://localhost:8080/login/oauth2/code/google?code=...&state=...
         └─ Server processes authorization code

4️⃣  BE: OAuth2SuccessHandler (CRITICAL POINT)
         ├─ Authenticate user with Google
         ├─ Find/Create user in DB
         ├─ Generate JWT token
         │  Headers: { "alg": "HS256", "typ": "JWT" }
         │  Payload: { "sub": "uuid", "email": "...@fpt.edu.vn", "role": "STUDENT|TEACHER|ADMIN", "iat": ..., "exp": ... }
         │  Signature: HS256(header.payload, secret)
         │
         └─ Redirect to: http://localhost:5173/oauth2/redirect?token=<JWT>
            (MUST include token in URL query parameter)

5️⃣  FE: Browser navigates to http://localhost:5173/oauth2/redirect?token=...
         └─ Route matches (external, no AppLayout)
         └─ OAuth2RedirectHandler.vue component mounts

6️⃣  FE: OAuth2RedirectHandler.vue
         ├─ Extract token from URL (?token=...)
         ├─ Call AuthService.setAuthToken(token)
         │  └─ Save to localStorage['authToken']
         │  └─ Set axios header: Authorization: Bearer <token>
         ├─ Call AuthService.getUserFromToken()
         │  └─ Decode JWT (no signature verification on client)
         │  └─ Extract: { userId, email, role }
         ├─ Determine redirect based on role:
         │  ├─ STUDENT → router.push({ name: 'studentDashboard' })
         │  ├─ TEACHER → router.push({ name: 'teacherDashboard' })
         │  └─ ADMIN → router.push({ name: 'adminDashboard' })
         └─ Show loading spinner during processing

7️⃣  FE: Router guard (beforeEach)
         ├─ Check requiresAuth: true
         ├─ Check auth.isAuthenticated.value === true
         ├─ Check role in meta.roles includes actual role
         └─ Allow navigation to dashboard

8️⃣  FE: Dashboard loads
         ├─ All API requests send Authorization header automatically
         └─ Backend verifies JWT and processes requests
```

---

## 🛠️ PHẦN 1: BACKEND - CẤU HÌNH REDIRECT

### Yêu Cầu Backend

Backend cần cung cấp endpoint `/oauth2/authorization/google` và xử lý callback tại `/login/oauth2/code/google`.

**Tùy chỉnh chính**: Hàm `OAuth2SuccessHandler`

---

### 1.1 File: `OAuth2SuccessHandler.java`

```java
package com.certifyme.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication) throws IOException, ServletException {

        try {
            // Step 1: Get user from OAuth2 authentication
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            // Step 2: Find or create user in database
            User user = getUserFromOAuth2(oAuth2User);

            // Step 3: Generate JWT token
            String jwtToken = jwtTokenProvider.generateToken(user);

            // Step 4: Build redirect URL with token
            // IMPORTANT: Token MUST be in URL parameter (not cookie)
            // Frontend will extract and save to localStorage
            String redirectUrl = frontendUrl + "/oauth2/redirect?token=" + jwtToken;

            // Step 5: Redirect browser to FE
            // Browser will handle 302 redirect automatically
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);

        } catch (Exception e) {
            // Handle errors
            String errorRedirect = frontendUrl + "/oauth2/redirect?error=authentication_failed&message=" + e.getMessage();
            getRedirectStrategy().sendRedirect(request, response, errorRedirect);
        }
    }

    private User getUserFromOAuth2(OAuth2User oAuth2User) {
        // Extract info from Google
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // Find existing user by email
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                // Create new user if not found
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setFullName(name);
                newUser.setAvatarUrl(picture);
                newUser.setRole("STUDENT"); // Default role for new users
                newUser.setIsActive(true);
                return userRepository.save(newUser);
            });

        return user;
    }
}
```

---

### 1.2 File: `application.yml` hoặc `application.properties`

Cấu hình URL của Frontend:

```yaml
# application.yml
app:
    frontend-url: http://localhost:5173 # Vite dev server port


# Hoặc dùng environment variable
# app.frontend-url=${FRONTEND_URL}
```

```properties
# application.properties
app.frontend-url=http://localhost:5173
```

**Production**:

```yaml
app:
    frontend-url: https://app.certifyme.fpt.edu.vn
```

---

### 1.3 JWT Token Requirements

Backend phải generate JWT với claims sau:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
.
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID (UUID)
  "email": "student@fpt.edu.vn",
  "role": "STUDENT",                              // UPPERCASE! STUDENT|TEACHER|ADMIN
  "iat": 1709123456,                              // Issued at (seconds)
  "exp": 1709209856                               // Expires (24h later)
}
.
<signature>
```

**Important Notes**:

- Role MUST be **UPPERCASE** (STUDENT, TEACHER, ADMIN)
- Expiration normally 24 hours after issue
- "sub" claim contains user ID

---

### 1.4 Example: JwtTokenProvider.java

```java
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 hours in milliseconds
    private long jwtExpirationMs;

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole()); // UPPERCASE

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(user.getId().toString())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS256, jwtSecret)
            .compact();
    }
}
```

---

### ✅ Backend Checklist

- [ ] OAuth2 security config có `.successHandler(oAuth2SuccessHandler)`
- [ ] `OAuth2SuccessHandler` implements `SimpleUrlAuthenticationSuccessHandler`
- [ ] Redirect URL = `${frontend-url}/oauth2/redirect?token=<JWT>`
- [ ] NO HttpOnly cookie (FE needs to read token from URL)
- [ ] JWT token includes: `sub`, `email`, `role` (UPPERCASE), `iat`, `exp`
- [ ] `app.frontend-url` cấu hình đúng port FE
- [ ] Error handling returns error in URL parameter

---

## 🎨 PHẦN 2: FRONTEND - CÁC BƯỚC XỬ LÝ

Frontend `src/router/index.js` đã có route `/oauth2/redirect`, sẵn sàng cho component `OAuth2RedirectHandler.vue`.

---

### 2.1 Verify Router Configuration

**File:** `src/router/index.js`

✅ Route `/oauth2/redirect` đã correct:

```javascript
{
    path: '/oauth2/redirect',
    name: 'oauth2Redirect',
    component: () => import('@/views/auth/OAuth2RedirectHandler.vue'),
    meta: { requiresAuth: false }  // ✅ PUBLIC route (no auth check)
}
```

**✅ Protected dashboard routes có UPPERCASE roles:**

```javascript
{
    path: '/student/dashboard',
    name: 'studentDashboard',
    component: () => import('@/views/student/StudentDashboard.vue'),
    meta: { requiresAuth: true, roles: ['STUDENT'] }  // ✅ UPPERCASE
}
```

**✅ Router guard kiểm tra role:**

```javascript
router.beforeEach((to, from, next) => {
    const auth = useAuth();
    const requiredRoles = to.meta.roles || [];

    if (requiredRoles.length && !requiredRoles.includes(auth.userRole.value)) {
        next({ name: 'accessDenied' });
        return;
    }
    next();
});
```

---

### 2.2 Implement OAuth2RedirectHandler.vue

**File:** `src/views/auth/OAuth2RedirectHandler.vue`

```vue
<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { handleOAuth2Callback } = useAuth();

onMounted(async () => {
    try {
        // ============================================
        // STEP 1: Extract token from URL parameter
        // ============================================
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        // Check for errors from backend
        if (error) {
            console.error('OAuth2 error from backend:', error);
            router.push({ name: 'login' });
            return;
        }

        // Check if token exists
        if (!token) {
            console.error('No token in OAuth2 redirect URL');
            router.push({ name: 'login' });
            return;
        }

        console.log('✅ Token extracted from URL');

        // ============================================
        // STEP 2: Process token via useAuth
        // ============================================
        // handleOAuth2Callback() does:
        // - Save token to localStorage
        // - Set axios Authorization header
        // - Decode JWT to get user info
        // - Update auth state (user, isAuthenticated, userRole)
        const userInfo = handleOAuth2Callback(token);

        console.log('✅ Token processed. User role:', userInfo.role);

        // ============================================
        // STEP 3: Frontend decides redirect by role
        // ============================================
        // This is the key difference! Frontend controls routing
        const roleRedirects = {
            STUDENT: { name: 'studentDashboard' },
            TEACHER: { name: 'teacherDashboard' },
            ADMIN: { name: 'adminDashboard' }
        };

        const redirectRoute = roleRedirects[userInfo.role];

        if (!redirectRoute) {
            console.error('Unknown user role:', userInfo.role);
            router.push({ name: 'login' });
            return;
        }

        console.log('✅ Redirecting to dashboard:', redirectRoute.name);

        // ============================================
        // STEP 4: Clean URL history
        // ============================================
        // Remove ?token=... from URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // ============================================
        // STEP 5: Navigate to role-specific dashboard
        // ============================================
        router.push(redirectRoute);
    } catch (error) {
        console.error('❌ OAuth2 callback error:', error);
        router.push({ name: 'login' });
    }
});
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <div class="text-center">
            <!-- Loading spinner -->
            <div class="flex justify-center mb-4">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900">
                    <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
                </div>
            </div>

            <!-- Loading text -->
            <h2 class="text-2xl font-semibold mb-2 text-surface-900 dark:text-surface-0">Đang xử lý đăng nhập...</h2>
            <p class="text-muted-color">Vui lòng chờ trong giây lát</p>
        </div>
    </div>
</template>

<style scoped>
.pi-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
```

---

### 2.3 Verify AuthService.js Methods

**File:** `src/services/AuthService.js`

Cần có các methods:

```javascript
const AuthService = {
    /**
     * Save JWT token to localStorage + set axios header
     */
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    /**
     * Get token from localStorage
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Decode JWT payload (no signature verification on client)
     */
    getUserFromToken() {
        const token = this.getToken();
        if (!token) return null;

        try {
            // Split JWT: header.payload.signature
            // Decode payload (part 2)
            const payload = JSON.parse(atob(token.split('.')[1]));

            return {
                userId: payload.sub, // User UUID
                email: payload.email,
                role: payload.role // UPPERCASE: STUDENT, TEACHER, ADMIN
            };
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    },

    /**
     * Check if token exists and not expired
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000); // Unix seconds
            return payload.exp > now;
        } catch {
            return false;
        }
    },

    /**
     * Clear auth state on logout
     */
    clearAuthData() {
        localStorage.removeItem('authToken');
        delete axiosInstance.defaults.headers.common['Authorization'];
    }
};
```

---

### 2.4 Verify useAuth.js Composable

**File:** `src/composables/useAuth.js`

Cần có method `handleOAuth2Callback`:

```javascript
export function useAuth() {
    const user = ref(null);
    const isAuthenticated = ref(false);
    const userRole = ref(null);

    /**
     * Handle OAuth2 callback - called from OAuth2RedirectHandler
     */
    const handleOAuth2Callback = (token) => {
        try {
            if (!token) throw new Error('No token provided');

            // Save token + set axios header
            AuthService.setAuthToken(token);

            // Decode to get user info
            const userInfo = AuthService.getUserFromToken();
            if (!userInfo) throw new Error('Invalid token');

            // Update composable state
            user.value = userInfo;
            isAuthenticated.value = true;
            userRole.value = userInfo.role; // UPPERCASE

            return userInfo;
        } catch (error) {
            console.error('OAuth2 callback error:', error);
            isAuthenticated.value = false;
            user.value = null;
            userRole.value = null;
            throw error;
        }
    };

    return {
        user,
        isAuthenticated,
        userRole,
        handleOAuth2Callback
    };
}
```

---

### ✅ Frontend Checklist

- [ ] `src/views/auth/OAuth2RedirectHandler.vue` exists
- [ ] Component extracts token from `?token=` parameter
- [ ] Component calls `handleOAuth2Callback(token)`
- [ ] `AuthService.setAuthToken()` saves to localStorage
- [ ] `AuthService.getUserFromToken()` decodes JWT
- [ ] Role is UPPERCASE (STUDENT, TEACHER, ADMIN)
- [ ] Router has `/oauth2/redirect` public route
- [ ] Dashboard routes have `requiresAuth: true`
- [ ] Router guard checks role with UPPERCASE comparison
- [ ] Navigation redirects correct dashboard per role

---

## 🧪 TESTING CHECKLIST

### Test 1: Successful Login Flow

```
✓ Open http://localhost:5173/auth/login
✓ Click "Đăng nhập với Google"
✓ Browser redirects to http://localhost:8080/oauth2/authorization/google
✓ Google login popup appears
✓ Enter test credentials
✓ After authorization, browser navigates to http://localhost:5173/oauth2/redirect?token=eyJhb...
✓ OAuth2RedirectHandler component loads
✓ Loading spinner shows
✓ After 1-2 seconds, redirects to appropriate dashboard:
  ✓ STUDENT → http://localhost:5173/student/dashboard
  ✓ TEACHER → http://localhost:5173/teacher/dashboard
  ✓ ADMIN → http://localhost:5173/admin/dashboard
✓ Dashboard loads successfully
```

### Test 2: Verify Token in LocalStorage

```javascript
// Open browser console (F12)
// Copy and paste:
console.log('Token:', localStorage.getItem('authToken'));

// Output should be JWT token starting with eyJ...
```

### Test 3: Verify Axios Header

```javascript
// In browser console:
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
console.log('Role:', payload.role); // Should be STUDENT, TEACHER, or ADMIN
```

### Test 4: Verify Axios Authorization Header

```javascript
// In browser console:
import axiosInstance from '@/lib/apiFetcher/axiosInstance';
console.log('Authorization header:', axiosInstance.defaults.headers.common.Authorization);
// Should output: Bearer eyJhb...
```

### Test 5: Check Protected Route Access

```
✓ Reload page (F5) - token should persist in localStorage
✓ Navigate to different route within dashboard
✓ API calls in Network tab should include Authorization header
✓ Logout should clear localStorage['authToken']
✓ After logout, accessing protected routes should redirect to /auth/login
```

---

## 🚀 BƯỚC TIẾP THEO

### Cho Backend Team:

1. **Implement OAuth2SuccessHandler**
    - Generate JWT với `sub`, `email`, `role` (UPPERCASE)
    - Redirect to `${frontend-url}/oauth2/redirect?token=<JWT>`

2. **Configure app.frontend-url**
    - Set based on environment (dev: 5173, prod: actual domain)

3. **Test redirect endpoint**
    - Manually test OAuth2 flow
    - Verify JWT token format

### Cho Frontend Team:

1. ✅ **Router đã setup** (`/oauth2/redirect` route, role guards)

2. **Verify implementation files**
    - `src/views/auth/OAuth2RedirectHandler.vue` present
    - `src/services/AuthService.js` has required methods
    - `src/composables/useAuth.js` has `handleOAuth2Callback`

3. **Test full OAuth2 flow**
    - Follow testing checklist above

4. **Deploy and monitor**
    - Check DevTools for any console errors
    - Monitor network requests for JWT

---

## 📚 REFERENCE DOCUMENTS

- [FE-REDIRECT-STRATEGY.md](./FE-REDIRECT-STRATEGY.md) - Detailed strategy comparison
- [FE-LOGIN-IMPLEMENTATION-GUIDE.md](./FE-LOGIN-IMPLEMENTATION-GUIDE.md) - Original implementation guide
- [BE-Integration-Guide.md](./BE-Integration-Guide.md) - Backend integration details

---

## 🎯 KEY POINTS (MEMORIZE)

1. **Backend redirects to**: `http://localhost:5173/oauth2/redirect?token=<JWT>`
2. **Frontend route**: `/oauth2/redirect` (PUBLIC, requiresAuth: false)
3. **Frontend handles**: Extract token → save → decode → redirect by role
4. **Role values**: UPPERCASE (STUDENT, TEACHER, ADMIN)
5. **Token storage**: localStorage (accessed by FE)
6. **Role-based redirect**:
    - STUDENT → `/student/dashboard`
    - TEACHER → `/teacher/dashboard`
    - ADMIN → `/admin/dashboard`

---

**Last Updated**: 2026-02-21  
**Status**: Ready for Implementation  
**Architecture**: Frontend Redirect (SPA Best Practice)
