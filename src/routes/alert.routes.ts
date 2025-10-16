import express from "express";
import AlertController from "../controllers/alert.controller";

const router = express.Router();

router.get("/", AlertController.getAllAlerts.bind(AlertController));

router.post("/", AlertController.createAlert.bind(AlertController));

router.get("/:id", AlertController.getAlertById.bind(AlertController));

router.put("/:id", AlertController.updateAlert.bind(AlertController));

router.patch("/:id/read", AlertController.markAsRead.bind(AlertController));



export default router;