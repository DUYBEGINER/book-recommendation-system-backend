import jwt from 'jsonwebtoken';
import { ApiResponse } from "#utils/index.js";
import "dotenv/config";


export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("Authorization Header:", authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Access Token:", token);
    if (!token) {
        return ApiResponse.error(res, 'Access token is missing', 401);
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRECT, (err, decoded) => {
        if (err) {
            console.log("Access token verification error:", err);
            return ApiResponse.error(res, 'Invalid or expired token', 403);
        }
        req.user = decoded;
        next();
    });
}
