import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  listResearchExperiments,
  listResearchModels
} from "../controllers/research.controller.js";

const router = Router();

router.use(protect);
router.get("/experiments", listResearchExperiments);
router.get("/models", listResearchModels);

export default router;