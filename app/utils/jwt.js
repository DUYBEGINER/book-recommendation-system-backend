import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function randomId() {
    return crypto.randomUUID();
}


export const signAccessToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
    }

    const jti = randomId();
    console.log("Generated JTI:", jti);
    const token = jwt.sign(
        payload, 
        process.env.JWT_SECRECT, 
        { 
            expiresIn: '1h' ,
            issuer: "tekbook-api",
            audience: "tekbook-client",
            jwtid: jti
        }
    );
    return token;
}

