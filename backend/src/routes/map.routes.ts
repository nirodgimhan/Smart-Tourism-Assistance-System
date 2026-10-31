
import { Router } from "express";
import { getRoadRoute } from
  "../controllers/map.controller.js";

const router = Router();

router.post("/route", getRoadRoute);

export default router;
