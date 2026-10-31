import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { ResearchExperiment } from "../models/ResearchExperiment.model.js";
import { fail, requireAdmin } from "../utils/http.js";

export async function listResearchExperiments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!(await requireAdmin(req, res))) return;

    const items = await ResearchExperiment.find()
      .select(
        "name algorithm datasetVersion metrics notes status createdAt"
      )
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export async function listResearchModels(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!(await requireAdmin(req, res))) return;

    res.json({
      success: true,
      items: [],
      message: "No validated trained models registered"
    });
  } catch (error) {
    fail(res, error);
  }
}