import { ApiResponse, logger } from "#utils/index.js";
import { OAuth2Client } from 'google-auth-library';
import { signAccessToken, signRefreshToken, refreshCookieOptions } from "#utils/jwt.js";
import { authService } from "#services/authService.js";
import { hashPassword, comparePassword } from "#utils/hashPassword.js";


const client = new OAuth2Client({
  clientId: process.env.GOOGLE_WEB_CLIENT_ID,
  clientSecret: process.env.GOOGLE_WEB_SECRECT,
  redirectUri: "http://localhost:8080/api/v1/auth/google"
});

export const tmpDB = {}; // Simulated temporary database
export const sessions = {}; // Simulated session store

export const googleLogin = async (req, res) => {
  try {
    const token = req.body?.credential;
    const { g_csrf_token } = req.body;

    const csrfCookie = req.cookies?.g_csrf_token;

    console.log("Token Id:", token);
    console.log("CSRF Token:", g_csrf_token);
    console.log("CSRF Cookie:", csrfCookie);

    if (!token) return ApiResponse.error(res, 'Token is required', 400);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    console.log('Payload:', payload);
    console.log('Google ID:', googleId);
    console.log('Email:', email);
    console.log('Name:', name);

    const user = tmpDB[googleId] || { userId: googleId, email, name, role: 'user' };
    tmpDB[googleId] = user;
    // Xử lý logic đăng nhập/đăng ký user ở đây
    // Có thể gọi service để lưu vào database
    // const { token: accessToken } = signAccessToken(user);
    const { refreshToken, refreshTokenId} = signRefreshToken(user);
    const { accessToken } = signAccessToken(user);
    console.log("Generated Refresh Token:", refreshToken);
    console.log("Generated Access Token:", accessToken);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    sessions[refreshTokenId] = user;
    console.log("Current Sessions:", sessions);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect về frontend callback page với flag oauth=success
    return res.redirect(`${frontendUrl}/oauth/callback?oauth=success`);
  } catch (error) {
    return ApiResponse.error(res, 'Google login failed', 500, error.message);
  }
};

export const loginWithEmailAndPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Login attempt', { email });
    
    // Tìm user trong database
    const user = await authService.findUserByEmail(email);
    
    if (!user) {
      logger.warn('Login failed: User not found', { email });
      return ApiResponse.error(res, 'Email hoặc mật khẩu không đúng', 401);
    }
    
    // Kiểm tra user có bị khóa không
    if (user.isBan) {
      logger.warn('Login failed: Account locked', { email, userId: user.id });
      return ApiResponse.error(res, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên', 403);
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Login failed: Invalid password', { email, userId: user.id });
      return ApiResponse.error(res, 'Email hoặc mật khẩu không đúng', 401);
    }
    
    // Tạo tokens
    const userPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role || 'user'
    };
    
    const { refreshToken, refreshTokenId } = signRefreshToken(userPayload);
    const { accessToken } = signAccessToken(userPayload);
    
    // Lưu refresh token vào session
    sessions[refreshTokenId] = userPayload;
    
    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    
    logger.info('Login successful', { 
      email, 
      userId: user.id, 
      refreshTokenId 
    });
    
    return ApiResponse.success(res, 'Đăng nhập thành công', {
      user: userPayload,
      accessToken,
      expiresIn: '15m' // Access token expiration time
    });
    
  } catch (error) {
    logger.error('Login error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống. Vui lòng thử lại sau', 500);
  }
};

export const registerWithEmailAndPassword = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    logger.info('Registration attempt', { email, fullName });
    
    // Kiểm tra email đã tồn tại
    const existingUser = await authService.findUserByEmail(email);
    
    if (existingUser) {
      logger.warn('Registration failed: Email already exists', { email });
      return ApiResponse.error(res, 'Email đã được sử dụng', 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Tạo user mới
    const newUser = await authService.createUser({
      username: email.split('@')[0], // Generate username from email
      email,
      password: hashedPassword,
      fullName,
      role: 'user',
      isActivate: false
    });
    
    // Tạo tokens
    const userPayload = {
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role
    };
    
    const { refreshToken, refreshTokenId } = signRefreshToken(userPayload);
    const { accessToken } = signAccessToken(userPayload);
    
    // Lưu refresh token vào session
    sessions[refreshTokenId] = userPayload;
    
    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    
    logger.info('Registration successful', { 
      email, 
      userId: newUser.id, 
      refreshTokenId 
    });
    
    return ApiResponse.success(res, 'Đăng ký thành công', {
      user: userPayload,
      accessToken,
      expiresIn: '15m'
    }, 201);
    
  } catch (error) {
    logger.error('Registration error', error);
    return ApiResponse.error(res, 'Lỗi hệ thống. Vui lòng thử lại sau', 500);
  }
};