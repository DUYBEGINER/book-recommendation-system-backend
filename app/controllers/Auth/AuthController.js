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
    const { credential, g_csrf_token } = req.body;

    console.log("Credential:", credential);
    console.log("CSRF Token:", g_csrf_token);
    
    if (!credential) return res.status(400).send("Missing credential");
    
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_WEB_CLIENT_ID,
    // });
    
    // const payload = ticket.getPayload();
    // const googleId = payload['sub'];
    // const email = payload['email'];
    // const name = payload['name'];

    // console.log('Google ID:', googleId);
    // console.log('Email:', email);
    // console.log('Name:', name);
    
    // Xử lý logic đăng nhập/đăng ký user ở đây
    // Có thể gọi service để lưu vào database

    return res.status(200).json({
      success: true,
      message: 'Google login successful',});
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Google login failed',
      error: error.message,
    });
  }
};