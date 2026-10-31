
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  submitContact
} from "../controllers/contact.controller.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages. Please try again later."
  }
});

router.post("/", contactLimiter, submitContact);

export default router;
