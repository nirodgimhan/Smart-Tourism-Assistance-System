import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { optimizedRoute } from "../controllers/route.controller.js";

const router = Router();

router.use(protect);
router.post("/optimize", optimizedRoute);

export default router;