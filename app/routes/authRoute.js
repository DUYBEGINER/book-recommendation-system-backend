import express from 'express';
// CONTROLLERS
import {googleLogin, loginWithEmailAndPassword, registerWithEmailAndPassword}  from '../controllers/Auth/AuthController.js';
import {refreshTokenHandler} from '../controllers/Auth/TokenController.js';

//MIDDLEWARES
import {authenticateToken} from '#middlewares/authenticateToken.js';
import { validate } from '#middlewares/validation.middleware.js';
import { loginRateLimit, registerRateLimit } from '#middlewares/rateLimit.middleware.js';

//VALIDATORS
import { 
  loginValidationSchema, 
  registerValidationSchema 
} from '#validators/auth.validator.js';

const router = express.Router();

// Authentication routes với rate limiting và validation
router.post("/auth/login", 
  loginRateLimit, 
  validate(loginValidationSchema), 
  loginWithEmailAndPassword
);

router.post("/auth/register", 
  registerRateLimit, 
  validate(registerValidationSchema), 
  registerWithEmailAndPassword
);

router.post("/auth/google", googleLogin);
router.post("/auth/refresh", refreshTokenHandler);

// Protected routes
router.get("/auth/profile", authenticateToken, (req, res) => {
    console.log("Authenticated user:", req.user);
    return res.status(200).json({ 
        message: "Protected profile data", 
        data: req.user 
    });
});

export {router as AuthRouter};
