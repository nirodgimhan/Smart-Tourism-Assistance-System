
import type { Request, Response } from "express";
import { z } from "zod";

import { calculateRoadRoute } from
  "../services/routing.service.js";

const routeSchema = z.object({
  start: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ]),
  destination: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ])
});

export async function getRoadRoute(
  req: Request,
  res: Response
) {
  const parsed = routeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid route coordinates",
      errors: parsed.error.flatten()
    });
    return;
  }

  try {
    const route = await calculateRoadRoute(
      parsed.data.start,
      parsed.data.destination
    );

    res.json({
      success: true,
      route
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Routing failed";

    res.status(502).json({
      success: false,
      message
    });
  }
}
