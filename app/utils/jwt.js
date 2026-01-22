import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function randomId() {
    return crypto.randomUUID();
}


export const signAccessToken = (user) => {
    const jti = randomId();

    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    }

    const token = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRECT,
        {
            expiresIn: '1h',
            subject: String(user.id),
            issuer: "tekbook-api",
            audience: "tekbook-client",
            jwtid: jti
        }
    );
    return {token, jti};
}

export const signRefreshToken = (user) => {
    const jti = randomId();
    const token = jwt.sign(
        { type: 'refresh' },
        process.env.JWT_REFRESH_SECRECT,
        {
            expiresIn: '1y',
            subject: String(user.id),
            issuer: "tekbook-api",
            audience: "tekbook-client",
            jwtid: jti
        }
    );

    return {token, jti};
}

export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,    // dev http => false, prod https => true
    sameSite: "lax",  
    path: "/auth/refresh",
  };
}
