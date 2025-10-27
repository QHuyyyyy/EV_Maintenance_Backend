import express from "express";
import AlertController from "../controllers/alert.controller";
import { validate } from "../middlewares/auth";

const router = express.Router();

router.get("/", validate, AlertController.getAllAlerts.bind(AlertController));

router.post("/", validate, AlertController.createAlert.bind(AlertController));

router.get("/:id", validate, AlertController.getAlertById.bind(AlertController));

router.patch("/:id", validate, AlertController.updateAlert.bind(AlertController));

router.patch("/:id/read", validate, AlertController.markAsRead.bind(AlertController));



export default router;