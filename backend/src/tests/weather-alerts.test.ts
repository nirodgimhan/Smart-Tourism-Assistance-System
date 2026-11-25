// Vitest tests for fetchWeatherAlerts

import { describe, it, expect, vi, afterEach } from "vitest";
import weatherProvider from "../integrations/weather.provider";

const { fetchWeatherAlerts } = weatherProvider;

// Helper to create a Response object (Node >=18 has built‑in fetch/Response)
function makeResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/xml" },
  });
}

afterEach(() => {
  // Restore any mocked globals after each test
  vi.restoreAllMocks();
  // Reset fetch mock to avoid cross‑test contamination
  // @ts-ignore
  delete (global as any).fetch;
});

describe("fetchWeatherAlerts", () => {
  it("returns empty array for empty RSS feed", async () => {
    const rss = `<?xml version="1.0"?><rss><channel></channel></rss>`;
    // Mock global fetch – only one call (RSS)
    global.fetch = vi.fn().mockResolvedValueOnce(makeResponse(rss));

    const alerts = await fetchWeatherAlerts();
    expect(alerts).toEqual([]);
    // Ensure fetch was called with redirect:"error"
    expect(global.fetch).toHaveBeenCalledWith(
      "https://was.meteo.gov.lk/cap/en/rss.xml",
      expect.objectContaining({ redirect: "error" })
    );
  });

  it("parses a valid RSS item with a valid CAP XML", async () => {
    const capUrl = "https://was.meteo.gov.lk/cap/en/alert1.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    const cap = `<?xml version="1.0"?>
      <alert>
        <identifier>test-id</identifier>
        <sender>test-sender</sender>
        <sent>2024-01-01T00:00:00Z</sent>
        <info language="en">
          <headline>Test Alert</headline>
          <description>Test description</description>
          <severity>Severe</severity>
          <urgency>Immediate</urgency>
          <certainty>Observed</certainty>
          <event>Test Event</event>
          <effective>2024-01-01T01:00:00Z</effective>
          <expires>2024-01-02T01:00:00Z</expires>
          <area>
            <areaDesc>Test Area</areaDesc>
          </area>
        </info>
      </alert>`;
    // First call – RSS, second call – CAP
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(rss))
      .mockResolvedValueOnce(makeResponse(cap));

    const alerts = await fetchWeatherAlerts();
    expect(alerts).toHaveLength(1);
    const a = alerts[0];
    expect(a.identifier).toBe("test-id");
    expect(a.title).toBe("Test Alert");
    expect(a.description).toBe("Test description");
    expect(a.severity).toBe("Severe");
    expect(a.urgency).toBe("Immediate");
    expect(a.certainty).toBe("Observed");
    expect(a.event).toBe("Test Event");
    expect(a.area).toBe("Test Area");
    expect(a.sourceUrl).toBe(capUrl);
    // Verify both fetch calls used redirect:"error"
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://was.meteo.gov.lk/cap/en/rss.xml",
      expect.objectContaining({ redirect: "error" })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      capUrl,
      expect.objectContaining({ redirect: "error" })
    );
  });

  it("prefers English <info> when multiple languages exist", async () => {
    const capUrl = "https://was.meteo.gov.lk/cap/en/alert-multi.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    const cap = `<?xml version="1.0"?>
      <alert>
        <identifier>multi-id</identifier>
        <sender>multi-sender</sender>
        <sent>2024-01-01T00:00:00Z</sent>
        <info>
          <language>fr</language>
          <headline>FR Title</headline>
        </info>
        <info>
          <language>en</language>
          <headline>EN Title</headline>
        </info>
      </alert>`;
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(rss))
      .mockResolvedValueOnce(makeResponse(cap));

    const alerts = await fetchWeatherAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toBe("EN Title");
  });

  it("throws when RSS item is missing a valid link", async () => {
    const rss = `<?xml version="1.0"?><rss><channel><item><title>Weather Alert</title></item></channel></rss>`;
    global.fetch = vi.fn().mockResolvedValueOnce(makeResponse(rss));
    await expect(fetchWeatherAlerts()).rejects.toThrow(/RSS item missing valid <link>/);
  });

  it("rejects non‑HTTPS RSS item URLs", async () => {
    const capUrl = "http://was.meteo.gov.lk/cap/en/alert.xml"; // http
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    global.fetch = vi.fn().mockResolvedValueOnce(makeResponse(rss));
    await expect(fetchWeatherAlerts()).rejects.toThrow(/Alert URL must use HTTPS/);
  });

  it("rejects URLs with unexpected hostname", async () => {
    const capUrl = "https://example.com/alert.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    global.fetch = vi.fn().mockResolvedValueOnce(makeResponse(rss));
    await expect(fetchWeatherAlerts()).rejects.toThrow(/Alert URL hostname must be was.meteo.gov.lk/);
  });

  it("rejects URLs containing credentials", async () => {
    const capUrl = "https://user:pass@was.meteo.gov.lk/alert.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    global.fetch = vi.fn().mockResolvedValueOnce(makeResponse(rss));
    await expect(fetchWeatherAlerts()).rejects.toThrow(/Alert URL must not contain user credentials/);
  });

  it("throws when CAP request returns non‑OK status", async () => {
    const capUrl = "https://was.meteo.gov.lk/cap/en/404.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(rss))
      .mockResolvedValueOnce(makeResponse("Not found", 404));
    let err: any;
    try {
      await fetchWeatherAlerts();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("CAP fetch error 404");
    expect(err.message).toContain(capUrl);
  });

  it("throws on network failure while fetching CAP", async () => {
    const capUrl = "https://was.meteo.gov.lk/cap/en/fail.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(rss))
      .mockRejectedValueOnce(new Error("network down"));
    let err: any;
    try {
      await fetchWeatherAlerts();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("Network error while fetching CAP");
    expect(err.message).toContain(capUrl);
  });

  it("throws on network failure while fetching RSS", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("rss outage"));
    await expect(fetchWeatherAlerts()).rejects.toThrow(/Network error while fetching alerts RSS/);
  });

  it("ensures redirect option is set to \"error\" for all fetches", async () => {
    const capUrl = "https://was.meteo.gov.lk/cap/en/alert.xml";
    const rss = `<?xml version="1.0"?><rss><channel><item><link>${capUrl}</link></item></channel></rss>`;
    const cap = `<?xml version="1.0"?>
      <alert>
        <identifier>test-id</identifier>
        <sender>test-sender</sender>
        <sent>2024-01-01T00:00:00Z</sent>
        <info>
          <headline>Test Alert</headline>
        </info>
      </alert>`;
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(rss))
      .mockResolvedValueOnce(makeResponse(cap));
    await fetchWeatherAlerts();
    // first call – RSS
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://was.meteo.gov.lk/cap/en/rss.xml",
      expect.objectContaining({ redirect: "error" })
    );
    // second call – CAP
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      capUrl,
      expect.objectContaining({ redirect: "error" })
    );
  });
});
