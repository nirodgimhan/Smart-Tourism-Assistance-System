import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { submitSOS } from "../controllers/sos.controller.js";

const router = Router();

router.use(protect);
router.post("/", submitSOS);

export default router;