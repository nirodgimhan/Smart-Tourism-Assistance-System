// Vitest tests for Hotel recommendation controller
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

import { recommendHotels } from "../controllers/hotel.controller.js";
import { recommendHotels as recommendHotelsService } from "../services/hotel.service.js";


// Mock the service function
vi.mock("../services/hotel.service.js", () => ({
  recommendHotels: vi.fn()
}));

// Helper to create a mock Express response object
function createMockResponse(): Response {
  const res: any = {};
  res.statusCode = 0;
  res.body = undefined;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    return res;
  };
  return res as Response;
}

describe("Hotel Recommendation Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with items on valid criteria", async () => {
    const mockResult = [
      { hotel: { name: "Alpha" }, score: 100, explanation: "test" },
      { hotel: { name: "Beta" }, score: 80, explanation: "test" }
    ];
    (recommendHotelsService as any).mockResolvedValue(mockResult);

    const req = { body: { districts: ["Colombo"] } } as unknown as Request;
    const res = createMockResponse();

    await recommendHotels(req, res);
    expect(recommendHotelsService).toHaveBeenCalledWith({ districts: ["Colombo"] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, items: mockResult });
  });

  it("returns 200 with empty items array when service returns none", async () => {
    (recommendHotelsService as any).mockResolvedValue([]);
    const req = { body: {} } as unknown as Request;
    const res = createMockResponse();
    await recommendHotels(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, items: [] });
  });

  it("returns 400 on invalid criteria and does not call service", async () => {
    const req = { body: { budgetLkr: -100 } } as unknown as Request;
    const res = createMockResponse();
    await recommendHotels(req, res);
    expect(recommendHotelsService).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid recommendation criteria");
  });

  it("returns 500 when recommendation service fails", async () => {
    (recommendHotelsService as any).mockRejectedValue(new Error("Service crash"));

    const req = { body: { districts: ["Colombo"] } } as unknown as Request;
    const res = createMockResponse();
    await recommendHotels(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unexpected server error");
  });
});
