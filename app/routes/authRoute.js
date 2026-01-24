import express from 'express';
// CONTROLLERS
import {googleLogin}  from '../controllers/Auth/AuthController.js';
import {refreshTokenHandler} from '../controllers/Auth/TokenController.js';


//MIDDLEWARES
import {authenticateToken} from '#middlewares/authenticateToken.js';

const router = express.Router();


router.get("/auth/profile", authenticateToken, (req, res) => {
    console.log("Authenticated user:", req.user);
    return res.status(200).json({ message: "Protected profile data", data: req.user });
}); 

router.post("/auth/refresh", refreshTokenHandler);

router.post("/auth/google",  googleLogin);

export {router as AuthRouter};
