import express from 'express';
import { userRegister, login, logOut, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Define routes
authRouter.post('/register', userRegister)
authRouter.post('/login', login );
authRouter.post('/logout', logOut );
authRouter.post('/send-otp-verify', userAuth, sendVerifyOtp );
authRouter.post('/verify-account', userAuth, verifyEmail );
authRouter.get('/is-auth', userAuth, isAuthenticated );
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;