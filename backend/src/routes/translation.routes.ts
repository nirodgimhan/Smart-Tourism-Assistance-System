
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";

import {
  translateText
} from "../controllers/translation.controller.js";

const router = Router();

router.use(protect);

router.post("/", translateText);

export default router;
