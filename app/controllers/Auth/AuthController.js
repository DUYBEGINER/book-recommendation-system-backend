/**
 * Authentication Controller
 * Handles login, registration, logout with Redis-backed sessions
 */
import { ApiResponse, logger } from "#utils/index.js";
import { OAuth2Client } from 'google-auth-library';
import { 
  signAccessToken, 
  signRefreshToken, 
  refreshCookieOptions,
  clearRefreshCookieOptions,
  verifyRefreshToken,
  TOKEN_EXPIRY 
} from "#utils/jwt.js";
import { authService } from "#services/authService.js";
import { sessionStore } from "#services/sessionStore.js";
import { hashPassword, comparePassword } from "#utils/hashPassword.js";


const client = new OAuth2Client({
  clientId: process.env.GOOGLE_WEB_CLIENT_ID,
  clientSecret: process.env.GOOGLE_WEB_SECRECT,
  redirectUri: "http://localhost:8080/api/v1/auth/google"
});

/**
 * Extract client metadata for session tracking
 */
function getClientMetadata(req) {
  return {
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
  };
}

/**
 * POST /auth/google - Google OAuth login
 * TODO: Implement proper Google OAuth with database user creation
 */
export const googleLogin = async (req, res) => {
  try {
    const token = req.body?.credential;
    const { g_csrf_token } = req.body;
    const csrfCookie = req.cookies?.g_csrf_token;

    if (!token) {
      return ApiResponse.error(res, 'Token is required', 400);
    }

    // Verify CSRF token
    if (g_csrf_token !== csrfCookie) {
      logger.warn('Google login: CSRF mismatch');
      return ApiResponse.error(res, 'Invalid CSRF token', 403);
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    // TODO: Find or create user in database
    // For now, using a simple user object
    const userPayload = { 
      userId: googleId, 
      email, 
      fullName: name, 
      role: 'user' 
    };

    // Generate tokens
    const { refreshToken, refreshTokenId } = signRefreshToken(googleId);
    const { accessToken } = signAccessToken(userPayload);
    
    // Store session in Redis
    const metadata = getClientMetadata(req);
    await sessionStore.createSession(googleId, refreshTokenId, refreshToken, metadata);
    
    // Set cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    
    logger.info('Google login successful', { email, googleId });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect to frontend with access token (refresh token is in HttpOnly cookie)
    return res.redirect(`${frontendUrl}/oauth/callback?oauth=success&token=${accessToken}`);
  } catch (error) {
    return ApiResponse.error(res, 'Google login failed', 500, error.message);
  }
};

/**
 * POST /auth/login - Email/password login
 * Creates Redis-backed session with hashed refresh token
 */
export const loginWithEmailAndPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Login attempt', { email });
    
    // Find user in database
    const user = await authService.findUserByEmail(email);
    
    if (!user) {
      logger.warn('Login failed: User not found', { email });
      return ApiResponse.error(res, 'Email hoặc mật khẩu không đúng', 401);
    }
    
    // Check if account is banned
    if (user.isBan) {
      logger.warn('Login failed: Account banned', { email, userId: user.id });
      return ApiResponse.error(res, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên', 403);
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Login failed: Invalid password', { email, userId: user.id });
      return ApiResponse.error(res, 'Email hoặc mật khẩu không đúng', 401);
    }
    
    // Build user payload for tokens
    const userPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role || 'user'
    };
    
    // Generate tokens
    const { refreshToken, refreshTokenId } = signRefreshToken(user.id);
    const { accessToken } = signAccessToken(userPayload);
    
    // Store session in Redis (hashed token, with TTL)
    const metadata = getClientMetadata(req);
    await sessionStore.createSession(user.id, refreshTokenId, refreshToken, metadata);
    
    // Set HttpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    
    logger.info('Login successful', { email, userId: user.id, jti: refreshTokenId });
    
    return ApiResponse.success(res, {
      user: userPayload,
      accessToken,
      expiresIn: TOKEN_EXPIRY.ACCESS,
    }, 'Đăng nhập thành công');
    
  } catch (error) {
    logger.error('Login error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống. Vui lòng thử lại sau', 500);
  }
};

/**
 * POST /auth/register - New user registration
 */
export const registerWithEmailAndPassword = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    logger.info('Registration attempt', { email, fullName });
    
    // Check if email exists
    const existingUser = await authService.findUserByEmail(email);
    
    if (existingUser) {
      logger.warn('Registration failed: Email exists', { email });
      return ApiResponse.error(res, 'Email đã được sử dụng', 409);
    }
    
    // Hash password with bcrypt
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const newUser = await authService.createUser({
      username: email.split('@')[0],
      email,
      password: hashedPassword,
      fullName,
      role: 'user',
      isActivate: false,
    });
    
    // Build payload
    const userPayload = {
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    };
    
    // Generate tokens
    const { refreshToken, refreshTokenId } = signRefreshToken(newUser.id);
    const { accessToken } = signAccessToken(userPayload);
    
    // Store session in Redis
    const metadata = getClientMetadata(req);
    await sessionStore.createSession(newUser.id, refreshTokenId, refreshToken, metadata);
    
    // Set cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    
    logger.info('Registration successful', { email, userId: newUser.id });
    
    return ApiResponse.success(res, {
      user: userPayload,
      accessToken,
      expiresIn: TOKEN_EXPIRY.ACCESS,
    }, 'Đăng ký thành công', 201);
    
  } catch (error) {
    logger.error('Registration error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống. Vui lòng thử lại sau', 500);
  }
};

/**
 * POST /auth/logout - Logout current device
 * Revokes the current refresh token from Redis
 */
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    
    if (!token) {
      // Already logged out, just clear cookie
      res.clearCookie("refreshToken", clearRefreshCookieOptions());
      return ApiResponse.success(res, null, 'Đăng xuất thành công');
    }
    
    try {
      // Decode token to get jti and userId
      const decoded = verifyRefreshToken(token);
      const userId = decoded.sub;
      const jti = decoded.jti;
      
      // Revoke session in Redis
      await sessionStore.revokeSession(userId, jti);
      
      logger.info('Logout successful', { userId, jti });
    } catch (err) {
      // Token invalid/expired - just clear cookie
      logger.warn('Logout with invalid token', { error: err.message });
    }
    
    // Always clear the cookie
    res.clearCookie("refreshToken", clearRefreshCookieOptions());
    
    return ApiResponse.success(res, null, 'Đăng xuất thành công');
    
  } catch (error) {
    logger.error('Logout error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống', 500);
  }
};

/**
 * POST /auth/logout-all - Logout all devices
 * Revokes all refresh tokens for the user
 */
export const logoutAll = async (req, res) => {
  try {
    // User must be authenticated (via access token)
    const userId = req.user?.userId;
    
    if (!userId) {
      return ApiResponse.error(res, 'Không có quyền truy cập', 401);
    }
    
    // Revoke all sessions
    const revokedCount = await sessionStore.revokeAllSessions(userId);
    
    // Clear current cookie
    res.clearCookie("refreshToken", clearRefreshCookieOptions());
    
    logger.info('Logout all successful', { userId, revokedCount });
    
    return ApiResponse.success(res, { 
      revokedSessions: revokedCount 
    }, 'Đã đăng xuất khỏi tất cả thiết bị');
    
  } catch (error) {
    logger.error('Logout all error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống', 500);
  }
};

/**
 * GET /auth/sessions - Get all active sessions (for account management)
 */
export const getSessions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return ApiResponse.error(res, 'Không có quyền truy cập', 401);
    }
    
    const sessions = await sessionStore.getUserSessions(userId);
    
    return ApiResponse.success(res, { sessions }, 'Danh sách phiên đăng nhập');
    
  } catch (error) {
    logger.error('Get sessions error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống', 500);
  }
};