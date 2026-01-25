# Auth API Documentation

## Login với Email và Password

### Endpoint
`POST /api/v1/auth/login`

### Rate Limiting
- **Giới hạn:** 5 requests per 15 phút per IP/email
- **Response khi vượt giới hạn:** 429 Too Many Requests

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Validation Rules
- **Email:**
  - Bắt buộc
  - Đúng định dạng email
  - Tự động chuyển thành lowercase
  
- **Password:**
  - Bắt buộc
  - Độ dài: 8-128 ký tự

### Response

#### Success (200)
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "userId": "123",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

#### Error Responses

**400 - Validation Error**
```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "statusCode": 400,
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Email không đúng định dạng",
        "value": "invalid-email"
      }
    ]
  }
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng",
  "statusCode": 401
}
```

**403 - Account Locked**
```json
{
  "success": false,
  "message": "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên",
  "statusCode": 403
}
```

**429 - Rate Limited**
```json
{
  "success": false,
  "message": "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
  "statusCode": 429
}
```

---

## Register với Email và Password

### Endpoint
`POST /api/v1/auth/register`

### Rate Limiting
- **Giới hạn:** 3 requests per 1 giờ per IP
- **Response khi vượt giới hạn:** 429 Too Many Requests

### Request Body
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123",
  "fullName": "Jane Doe"
}
```

### Validation Rules
- **Email:**
  - Bắt buộc
  - Đúng định dạng email
  - Tự động chuyển thành lowercase
  
- **Password:**
  - Bắt buộc
  - Độ dài: 8-128 ký tự
  - Chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số
  
- **confirmPassword:**
  - Bắt buộc
  - Phải khớp với password
  
- **fullName:**
  - Bắt buộc
  - Độ dài: 2-100 ký tự

### Response

#### Success (201)
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "userId": "124",
      "email": "newuser@example.com",
      "fullName": "Jane Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

#### Error Responses

**409 - Conflict**
```json
{
  "success": false,
  "message": "Email đã được sử dụng",
  "statusCode": 409
}
```

---

## Security Features

### 1. Password Security
- Sử dụng bcrypt với salt rounds = 12
- Password requirements: minimum 8 chars, uppercase, lowercase, number

### 2. Account Locking
- Tự động khóa tài khoản sau 5 lần đăng nhập thất bại
- Reset counter khi đăng nhập thành công

### 3. Rate Limiting
- Login: 5 attempts per 15 minutes per IP/email
- Registration: 3 attempts per hour per IP
- API general: 100 requests per 15 minutes

### 4. Input Validation
- Comprehensive Joi validation schemas
- Automatic data sanitization
- Detailed error messages in Vietnamese

### 5. Logging
- Detailed security event logging
- Failed login attempts tracking
- Rate limit violations logging

### 6. Token Management
- JWT access tokens (15 minutes expiry)
- Refresh tokens with secure HTTP-only cookies
- Session management with automatic cleanup