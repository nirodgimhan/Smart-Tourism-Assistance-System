import { Router } from "express";
import { getHeritage } from "../controllers/heritage.controller.js";

const router = Router();

router.get("/", getHeritage);

export default router;