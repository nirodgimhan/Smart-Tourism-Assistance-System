import { Router } from "express";
import { getEmergencyContacts } from "../controllers/emergency.controller.js";

const router = Router();

router.get("/contacts", getEmergencyContacts);

export default router;