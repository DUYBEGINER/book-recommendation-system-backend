# Google OAuth Authentication - Documentation

## Tổng quan

Tài liệu này mô tả chi tiết về tính năng đăng nhập bằng Google OAuth đã được refactor để tuân theo best practices và dễ dàng bảo trì, mở rộng.

---

## 1. Các vấn đề đã được sửa

### Backend

| Vấn đề | Mô tả | Giải pháp |
|--------|-------|-----------|
| **Critical Bug: BigInt Overflow** | Sử dụng Google ID (`sub`) làm `userId` cho token và session. Google ID là chuỗi số 21 chữ số gây lỗi khi convert sang BigInt | Tạo/tìm user trong database và sử dụng database user ID thay vì Google ID |
| **TODO not implemented** | Code chưa implement tìm/tạo user trong database | Thêm function `findOrCreateOAuthUser()` trong authService |
| **Hardcoded values** | Hardcode `redirectUri` trong OAuth2Client | Sử dụng environment variable |
| **Typo in env variable** | `GOOGLE_WEB_SECRECT` sai chính tả | Đổi thành `GOOGLE_WEB_SECRET` |
| **Missing error handling** | Không xử lý trường hợp user bị ban khi login Google | Thêm kiểm tra `isBan` và redirect với error message |
| **Undefined redirect** | `FRONTEND_URL` có thể undefined | Thêm fallback default value |
| **Code duplication** | Logic tạo session và set cookie bị duplicate | Extract thành helper function `createSessionAndSetCookie()` |

### Frontend

| Vấn đề | Mô tả | Giải pháp |
|--------|-------|-----------|
| **Hardcoded Client ID** | Google Client ID được hardcode trong code | Sử dụng `VITE_GOOGLE_CLIENT_ID` env variable |
| **Hardcoded API URL** | `login_uri` hardcode localhost | Sử dụng `VITE_API_BASE_URL` env variable |
| **Inconsistent naming** | `fetchUserProfile` vs `getUserProfile` | Thêm alias cho backward compatibility |
| **Redundant storage** | Lưu token 2 lần (`setAuthData` và `localStorage.setItem`) | Chỉ gọi `setAuthData` |
| **Missing dark mode** | OAuthRedirect không support dark mode | Thêm dark mode classes |
| **No error mapping** | Error message không user-friendly | Thêm `ERROR_MESSAGES` mapping |
| **React StrictMode issue** | useEffect có thể chạy 2 lần | Thêm `useRef` để track processed state |

---

## 2. Luồng hoạt động chi tiết

### 2.1 Sequence Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │  Google  │     │ Backend  │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ Click Google   │                │                │                │
     │ Sign-In Button │                │                │                │
     │───────────────>│                │                │                │
     │                │                │                │                │
     │                │  Redirect to   │                │                │
     │                │  Google Login  │                │                │
     │                │───────────────>│                │                │
     │                │                │                │                │
     │                │                │ User enters    │                │
     │                │                │ credentials    │                │
     │                │                │<───────────────│                │
     │                │                │                │                │
     │                │                │  POST /auth/google              │
     │                │                │  (ID Token + CSRF)              │
     │                │                │───────────────>│                │
     │                │                │                │                │
     │                │                │                │ Verify ID Token│
     │                │                │                │ with Google    │
     │                │                │                │───────────────>│
     │                │                │                │<───────────────│
     │                │                │                │                │
     │                │                │                │ findOrCreate   │
     │                │                │                │ OAuthUser      │
     │                │                │                │───────────────>│
     │                │                │                │<───────────────│
     │                │                │                │                │
     │                │                │                │ Create Session │
     │                │                │                │ in Redis       │
     │                │                │                │                │
     │                │  Redirect to   │                │                │
     │                │  /oauth/callback?oauth=success  │                │
     │                │  (Set refreshToken cookie)      │                │
     │                │<────────────────────────────────│                │
     │                │                │                │                │
     │                │  POST /auth/refresh             │                │
     │                │  (Cookie auto-sent)             │                │
     │                │────────────────────────────────>│                │
     │                │                │                │                │
     │                │                │                │ Validate       │
     │                │                │                │ Session        │
     │                │                │                │                │
     │                │  Response:     │                │                │
     │                │  { accessToken }               │                │
     │                │<────────────────────────────────│                │
     │                │                │                │                │
     │                │  GET /auth/profile             │                │
     │                │  (Bearer token)                │                │
     │                │────────────────────────────────>│                │
     │                │                │                │───────────────>│
     │                │                │                │<───────────────│
     │                │  Response:     │                │                │
     │                │  { user data } │                │                │
     │                │<────────────────────────────────│                │
     │                │                │                │                │
     │  Redirect to   │                │                │                │
     │  Home Page     │                │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
```

### 2.2 Mô tả từng bước

#### Bước 1: User click "Sign in with Google"
- Component: `ButtonLoginGoogle.jsx`
- Google Identity Services SDK được khởi tạo với:
  - `client_id`: Từ env `VITE_GOOGLE_CLIENT_ID`
  - `ux_mode`: "redirect" (chuyển hướng đến Google)
  - `login_uri`: Backend endpoint `/api/v1/auth/google`

#### Bước 2: Google xử lý authentication
- User chọn tài khoản Google và đồng ý cấp quyền
- Google redirect về `login_uri` với:
  - `credential`: ID Token (JWT chứa thông tin user)
  - `g_csrf_token`: CSRF token để chống tấn công

#### Bước 3: Backend xử lý Google callback
- File: `AuthController.js` → `googleLogin()`
- Các bước xử lý:
  1. Validate CSRF token
  2. Verify ID Token với Google OAuth2Client
  3. Extract thông tin user từ token (email, name, picture)
  4. Gọi `findOrCreateOAuthUser()` để tìm/tạo user trong DB
  5. Kiểm tra user có bị ban không
  6. Tạo session trong Redis
  7. Set refresh token vào HttpOnly cookie
  8. Redirect về frontend với `oauth=success`

#### Bước 4: Frontend xử lý OAuth callback
- Component: `OAuthRedirect.jsx`
- Các bước:
  1. Kiểm tra `oauth` query param
  2. Nếu `success`: gọi `/auth/refresh` để lấy access token
  3. Lưu access token vào localStorage
  4. Fetch user profile và update AuthContext
  5. Redirect về trang chủ

#### Bước 5: Subsequent requests
- Access token được gửi trong header `Authorization: Bearer <token>`
- Khi access token hết hạn, `ApiConfig.js` interceptor tự động gọi `/auth/refresh`
- Refresh token rotation: mỗi lần refresh, token cũ bị revoke, token mới được tạo

---

## 3. Cấu trúc code

### 3.1 Backend

```
app/
├── controllers/Auth/
│   ├── AuthController.js    # Xử lý login, register, logout, Google OAuth
│   └── TokenController.js   # Xử lý refresh token
├── services/
│   ├── authService.js       # Business logic: findOrCreateOAuthUser, etc.
│   └── sessionStore.js      # Redis session management
├── utils/
│   └── jwt.js              # JWT signing/verification
└── routes/
    └── authRoute.js        # Route definitions
```

### 3.2 Frontend

```
src/
├── components/
│   └── ButtonLoginGoogle.jsx   # Google Sign-In button
├── pages/Auth/
│   └── OAuthRedirect.jsx       # OAuth callback handler
├── contexts/
│   ├── AuthContext.jsx         # Auth context definition
│   └── AuthProvider.jsx        # Auth state management
├── services/
│   └── authService.js          # API calls
├── config/
│   └── ApiConfig.js            # Axios instance with interceptors
└── utils/
    └── storage.js              # Token storage utilities
```

---

## 4. Environment Variables

### Backend (.env)

```env
# Google OAuth
GOOGLE_WEB_CLIENT_ID=your-google-client-id
GOOGLE_WEB_SECRET=your-google-client-secret

# JWT
JWT_ACCESS_SECRECT=your-access-token-secret
JWT_REFRESH_SECRECT=your-refresh-token-secret

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173

# Redis
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)

```env
# API
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 5. Security Features

### 5.1 Token Security

| Feature | Implementation |
|---------|---------------|
| **Access Token** | Short-lived (15 min), stored in localStorage |
| **Refresh Token** | Long-lived (7 days), HttpOnly cookie |
| **Token Rotation** | Mỗi lần refresh, token cũ bị revoke |
| **Session Hashing** | Refresh token được hash (SHA-256) trước khi lưu Redis |
| **Theft Detection** | Token mismatch → revoke tất cả sessions |

### 5.2 CSRF Protection

- Google gửi `g_csrf_token` trong body
- Backend verify với cookie `g_csrf_token`
- Sử dụng `sameSite: "strict"` cho cookie trong production

### 5.3 Cookie Security

```javascript
{
  httpOnly: true,          // Không truy cập được từ JavaScript
  secure: true,            // Chỉ gửi qua HTTPS (production)
  sameSite: "strict",      // Chống CSRF
  path: "/api/v1/auth",    // Chỉ gửi đến auth endpoints
}
```

---

## 6. Error Handling

### Backend Error Responses

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `missing_token` | Redirect | ID Token không có trong request |
| `csrf_invalid` | Redirect | CSRF token không khớp |
| `account_banned` | Redirect | Tài khoản bị khóa |
| `token_expired` | Redirect | ID Token hết hạn |
| `server_error` | Redirect | Lỗi server |

### Frontend Error Messages

```javascript
const ERROR_MESSAGES = {
  missing_token: 'Token không hợp lệ. Vui lòng thử lại.',
  csrf_invalid: 'Phiên đăng nhập không hợp lệ. Vui lòng thử lại.',
  account_banned: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
  token_expired: 'Phiên đăng nhập đã hết hạn. Vui lòng thử lại.',
  server_error: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  default: 'Đăng nhập thất bại. Vui lòng thử lại.',
};
```

---

## 7. Database Schema

### User được tạo từ Google OAuth

```sql
INSERT INTO users (
  username,      -- Generated: email_prefix_timestamp
  email,         -- From Google profile
  password,      -- Random 64-char hex (không sử dụng)
  full_name,     -- From Google profile
  avatar_url,    -- From Google profile picture
  role_id,       -- Default: 'user' role
  is_activate,   -- true (Google accounts are pre-verified)
  is_ban         -- false
)
```

---

## 8. Testing

### Manual Testing Steps

1. **Happy Path**
   - Click "Sign in with Google"
   - Chọn tài khoản Google
   - Verify redirect về frontend với success message
   - Verify user profile loaded correctly

2. **Error Cases**
   - Test với tài khoản đã bị ban
   - Test với ID token hết hạn
   - Test CSRF attack (bỏ cookie)

3. **Session Management**
   - Verify multiple device login
   - Test logout all devices
   - Verify token rotation

### API Testing (cURL)

```bash
# Test refresh token
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=your-refresh-token"

# Test get sessions
curl -X GET http://localhost:8080/api/v1/auth/sessions \
  -H "Authorization: Bearer your-access-token"
```

---

## 9. Extensibility

### Thêm OAuth Provider mới (Facebook, GitHub, etc.)

1. Tạo route mới trong `authRoute.js`
2. Tạo handler mới trong `AuthController.js` (copy pattern từ `googleLogin`)
3. Sử dụng lại `findOrCreateOAuthUser()` - chỉ cần pass email, fullName, avatarUrl
4. Frontend: tạo button component mới tương tự `ButtonLoginGoogle.jsx`

### Thêm fields mới cho OAuth user

1. Update `findOrCreateOAuthUser()` trong `authService.js`
2. Update schema nếu cần
3. Pass thêm data từ OAuth provider

---

## 10. Files đã thay đổi

| File | Thay đổi |
|------|----------|
| `app/services/authService.js` | Thêm `findOrCreateOAuthUser()`, refactor với helper functions và comments |
| `app/controllers/Auth/AuthController.js` | Fix Google OAuth, thêm helper functions, cải thiện error handling |
| `src/components/ButtonLoginGoogle.jsx` | Sử dụng env variables, thêm comments |
| `src/pages/Auth/OAuthRedirect.jsx` | Cải thiện error handling, dark mode, prevent double execution |
| `src/contexts/AuthProvider.jsx` | Clean up, thêm comments, fix naming consistency |

---

## Author

Generated by GitHub Copilot - March 2026
