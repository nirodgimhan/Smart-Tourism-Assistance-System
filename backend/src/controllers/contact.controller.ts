
import type { Request, Response } from "express";
import { z } from "zod";

import { Contact } from "../models/Contact.model.js";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.email().max(254),

  subject: z.string().trim().min(3).max(150),

  message: z.string().trim().min(10).max(5000)
});

// POST /api/v1/contact
export async function submitContact(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please enter valid contact details.",
        errors: z.flattenError(parsed.error)
      });
      return;
    }

    const contact = await Contact.create({
      ...parsed.data,
      status: "new"
    });

    res.status(201).json({
      success: true,
      message: "Your message has been received.",
      contactId: contact._id
    });
  } catch (error) {
    console.error("Contact submission error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit your message."
    });
  }
}
