import jwt from 'jsonwebtoken';
import { ApiResponse, logger } from '#utils/index.js';
import "dotenv/config";
import { sessions, tmpDB } from './AuthController.js';
import { signAccessToken, signRefreshToken, refreshCookieOptions } from '#utils/jwt.js';
import { authService } from "#services/authService.js";

export async function refreshTokenHandler(req, res) {
  const token = req.cookies?.refreshToken;
  console.log("req cookies:", req.cookies);
  console.log("Refresh Token from cookie:", token);
  if (!token) {
    return ApiResponse.error(res, 'Refresh token missing', 401);
  }
  
  jwt.verify(token, process.env.JWT_REFRESH_SECRECT, async (err, decoded) => {
    if (err) {
      console.log("Refresh token verification error:", err);
      return ApiResponse.error(res, 'Invalid or expired refresh token', 403);
    }
    console.log("tmpDB: ", tmpDB);
    console.log("Decoded refresh token:", decoded);
    const userId = sessions[decoded.jti];
    if (!userId) {
      return ApiResponse.error(res, 'User not found for this refresh token', 404);
    }
    // const user = tmpDB[userId];
    const user = await authService.getUserById(userId);

    const userPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role || 'user'
    };
    // Additional checks (e.g., token version) happen here
    // const user = tmpDB[userId];
    const { accessToken } = signAccessToken(userPayload);
    console.log("New Access Token:", accessToken);
    logger.info('Access token refreshed for user:', decoded.sub);
    // A new refresh token will also be generated here if using rotation

    return ApiResponse.success(res, { accessToken: accessToken }, 'Token refreshed successfully');
  });
}