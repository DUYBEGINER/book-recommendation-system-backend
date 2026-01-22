import jwt from 'jsonwebtoken';
import { ApiResponse } from '#utils/response.js';

export async function refreshTokenHandler(req, res) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return ApiResponse.error(res, 'Refresh token missing', 401);
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRECT, async (err, decoded) => {
    if (err) {
      return ApiResponse.error(res, 'Invalid or expired refresh token', 403);
    }

    // Additional checks (e.g., token version) happen here

    const newAccessToken = jwt.sign(
      { sub: decoded.sub, role: decoded.role },
      process.env.JWT_ACCESS_SECRECT,
      { expiresIn: '15m' }
    );

    // A new refresh token will also be generated here if using rotation

    return res.json({ accessToken: newAccessToken });
  });
}