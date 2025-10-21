import express from "express";
import { loginController, registerController, refreshTokenController, logoutController, getProfileController, firebaseOtpLoginController, registerDeviceTokenController, unregisterDeviceTokenController } from "../controllers/auth.controller";
import { validate } from "../middlewares/auth";

const router = express.Router();

router.post("/login", loginController);
router.post("/login-otp", firebaseOtpLoginController);
router.post("/register", registerController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);
router.get("/profile", validate, getProfileController);

/**
 * 🔔 Device Token Endpoints (Firebase Cloud Messaging)
 * 
 * Pattern: Same as alert-backend
 * - POST /auth/deviceToken - Register device token
 * - DELETE /auth/deviceToken - Remove device token
 */
router.post("/deviceToken", validate, registerDeviceTokenController);
router.delete("/deviceToken", validate, unregisterDeviceTokenController);

export default router;
