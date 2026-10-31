import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { replanTrip } from "../controllers/replan.controller.js";

const router = Router();

router.use(protect);
router.post("/", replanTrip);

export default router;