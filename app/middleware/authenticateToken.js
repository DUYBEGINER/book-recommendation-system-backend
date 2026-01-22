import jwt from 'jsonwebtoken';
import { ApiResponse } from "#utils/index.js";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return ApiResponse.error(res, 'Access token is missing', 401);
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRECT, (err, decoded) => {
        if (err) {
            return ApiResponse.error(res, 'Invalid or expired token', 403);
        }
        req.user = decoded;
        next();
    });

}