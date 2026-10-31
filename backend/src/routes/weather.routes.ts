import { Router } from "express";
import {
  getForecast,
  getWeatherAlerts
} from "../controllers/weather.controller.js";

const router = Router();

router.get("/forecast", getForecast);
router.get("/alerts", getWeatherAlerts);

export default router;