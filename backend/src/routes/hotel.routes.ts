import { Router } from "express";
import {
  getHotels,
  getHotelById,
  recommendHotels
} from "../controllers/hotel.controller.js";

const router = Router();

router.get("/", getHotels);
router.post("/recommend", recommendHotels);
router.get("/:id", getHotelById);

export default router;