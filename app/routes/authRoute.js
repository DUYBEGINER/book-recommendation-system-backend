import express from 'express';
import {googleLogin}  from '../controllers/Auth/AuthController.js';
const router = express.Router();

router.post("/auth/google",  googleLogin)

export {router as AuthRouter};
