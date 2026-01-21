import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import url from 'url';

const client = new OAuth2Client({
    clientId: process.env.GOOGLE_WEB_CLIENT_ID,
    clientSecret: process.env.GOOGLE_WEB_SECRECT,
    redirectUri: "http://localhost:8080/api/v1/auth/google"
}
);


export const googleLogin = async (req, res) => {
  try {
    const { g_csrf_token } = req.body;
    const token = req.body?.credential;
    const csrfCookie = req.cookies?.g_csrf_token;
    
    console.log("Token Id:", token);
    console.log("CSRF Token:", g_csrf_token);
    console.log("CSRF Cookie:", csrfCookie);

    if (!token) return res.status(400).send("Missing credential");
    
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
    
    // Xử lý logic đăng nhập/đăng ký user ở đây
    // Có thể gọi service để lưu vào database
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}`);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Google login failed',
      error: error.message,
    });
  }
};