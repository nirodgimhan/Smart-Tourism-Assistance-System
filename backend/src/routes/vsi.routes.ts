import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { calculateVSI } from "../controllers/vsi.controller.js";

const router = Router();

router.use(protect);
router.post("/calculate", calculateVSI);

export default router;