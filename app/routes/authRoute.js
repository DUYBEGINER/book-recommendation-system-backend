import express from 'express';

// CONTROLLERS
import {
  googleLogin, 
  loginWithEmailAndPassword, 
  registerWithEmailAndPassword,
  logout,
  logoutAll,
  getSessions
} from '../controllers/Auth/AuthController.js';
import { refreshTokenHandler } from '../controllers/Auth/TokenController.js';

// MIDDLEWARES
import { authenticateToken } from '#middlewares/authenticateToken.js';
import { validate } from '#middlewares/validation.middleware.js';
import { loginRateLimit, registerRateLimit } from '#middlewares/rateLimit.middleware.js';

// VALIDATORS
import { 
  loginValidationSchema, 
  registerValidationSchema 
} from '#validators/auth.validator.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

// Login with rate limiting and validation
router.post("/auth/login", 
  loginRateLimit, 
  validate(loginValidationSchema), 
  loginWithEmailAndPassword
);

// Register with rate limiting and validation
router.post("/auth/register", 
  registerRateLimit, 
  validate(registerValidationSchema), 
  registerWithEmailAndPassword
);

// Google OAuth
router.post("/auth/google", googleLogin);

// Refresh token (uses HttpOnly cookie)
router.post("/auth/refresh", refreshTokenHandler);

// Logout current device (public - clears cookie even if token invalid)
router.post("/auth/logout", logout);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

// Logout all devices
router.post("/auth/logout-all", authenticateToken, logoutAll);

// Get all active sessions
router.get("/auth/sessions", authenticateToken, getSessions);

// Get current user profile
router.get("/auth/profile", authenticateToken, (req, res) => {
  return res.status(200).json({ 
    success: true,
    message: "Profile data", 
    data: {
      userId: req.user.userId,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
    }
  });
});

export { router as AuthRouter };
