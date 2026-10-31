import { Router } from "express";
import { getPois } from "../controllers/poi.controller.js";

const router = Router();

router.get("/", getPois);

export default router;