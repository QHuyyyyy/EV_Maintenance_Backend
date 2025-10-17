import express from "express";
import { loginController, registerController, refreshTokenController, logoutController, getProfileController, loginWithOTPController } from "../controllers/auth.controller";
import { validate } from "../middlewares/auth";

const router = express.Router();

router.post("/login", loginController);
router.post("/login-otp", loginWithOTPController);
router.post("/register", registerController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);
router.get("/profile", validate, getProfileController);


export default router;
