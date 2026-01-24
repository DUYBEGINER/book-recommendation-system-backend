import { ApiResponse, logger } from "#utils/index.js";
import { OAuth2Client } from 'google-auth-library';
import { signAccessToken, signRefreshToken, refreshCookieOptions } from "#utils/jwt.js";


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