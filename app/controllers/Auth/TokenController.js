import jwt from 'jsonwebtoken';
import { ApiResponse, logger } from '#utils/index.js';
import "dotenv/config";
import { sessions, tmpDB } from './AuthController.js';
import { signAccessToken, signRefreshToken, refreshCookieOptions } from '#utils/jwt.js';

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
    const user = tmpDB[decoded.sub];
    if (!user) {
      return ApiResponse.error(res, 'User not found for this refresh token', 404);
    }
    // Additional checks (e.g., token version) happen here
    // const user = 
    const { accessToken } = signAccessToken(user);
    console.log("New Access Token:", accessToken);
    logger.info('Access token refreshed for user:', decoded.sub);
    // A new refresh token will also be generated here if using rotation

    return ApiResponse.success(res, { accessToken: accessToken }, 'Token refreshed successfully');
  });
}