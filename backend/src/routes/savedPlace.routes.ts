import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getSavedPlaces,
  savePlace,
  removeSavedPlace
} from "../controllers/savedPlace.controller.js";

const router = Router();

router.use(protect);
router.get("/", getSavedPlaces);
router.post("/", savePlace);
router.delete("/:id", removeSavedPlace);

export default router;