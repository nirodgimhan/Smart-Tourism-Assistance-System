import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getMyAccount } from "../controllers/user.controller.js";

const router = Router();

router.use(protect);
router.get("/me", getMyAccount);

export default router;