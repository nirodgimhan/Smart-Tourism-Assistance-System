
import { Router } from "express";
import {
  getDestinations,
  getDestination,
  nearbyDestinations
} from "../controllers/destination.controller.js";

const router = Router();

router.get("/", getDestinations);
router.get("/nearby", nearbyDestinations);
router.get("/:id", getDestination);

export default router;
