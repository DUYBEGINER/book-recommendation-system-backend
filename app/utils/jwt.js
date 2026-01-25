import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import "dotenv/config";

function randomId() {
    return crypto.randomUUID();
}


export const signAccessToken = (user) => {
    const jti = randomId();

    const payload = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRECT,
        {
            expiresIn: 60,
            subject: String(user.userId),
            issuer: "tekbook-api",
            audience: "tekbook-client",
            jwtid: jti
        }
    );
    return {accessToken, accessTokenId: jti};
}

export const signRefreshToken = (user) => {
    const jti = randomId();

    const refreshToken = jwt.sign(
        {type: 'refresh'},
        process.env.JWT_REFRESH_SECRECT,
        {
            expiresIn: 120,
            subject: String(user.userId),
            issuer: "tekbook-api",
            audience: "tekbook-client",
            jwtid: jti
        }
    );

    return {refreshToken, refreshTokenId: jti};
}

export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,    // dev http => false, prod https => true
    sameSite: "lax",  
    path: "/api/v1/auth/refresh",
  };
}
