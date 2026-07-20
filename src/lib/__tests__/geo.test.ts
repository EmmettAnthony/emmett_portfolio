import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@vercel/functions", () => ({
  geolocation: vi.fn(),
}));

import { geolocation } from "@vercel/functions";

let getCountryFromRequest: (request: NextRequest) => string | null;
let getCountryFromIp: (ip: string) => Promise<string | null>;
let resolveCountry: (request?: NextRequest, ip?: string) => Promise<string | null>;

const mockRequest = {} as NextRequest;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ countryCode: "US" }),
    }),
  );
  const geo = await import("../geo");
  getCountryFromRequest = geo.getCountryFromRequest;
  getCountryFromIp = geo.getCountryFromIp;
  resolveCountry = geo.resolveCountry;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("getCountryFromRequest", () => {
  it("returns country from geolocation(request)", () => {
    vi.mocked(geolocation).mockReturnValue({ country: "US" });
    expect(getCountryFromRequest(mockRequest)).toBe("US");
  });

  it("returns null when geo.country is undefined", () => {
    vi.mocked(geolocation).mockReturnValue({ country: undefined });
    expect(getCountryFromRequest(mockRequest)).toBeNull();
  });

  it("returns null when geo.country is null", () => {
    vi.mocked(geolocation).mockReturnValue({ country: null });
    expect(getCountryFromRequest(mockRequest)).toBeNull();
  });

  it("returns null when geo has no country property", () => {
    vi.mocked(geolocation).mockReturnValue({});
    expect(getCountryFromRequest(mockRequest)).toBeNull();
  });

  it("returns null when geolocation throws", () => {
    vi.mocked(geolocation).mockImplementation(() => {
      throw new Error("geolocation error");
    });
    expect(getCountryFromRequest(mockRequest)).toBeNull();
  });

  it("returns null when geolocation returns undefined", () => {
    vi.mocked(geolocation).mockReturnValue(undefined);
    expect(getCountryFromRequest(mockRequest)).toBeNull();
  });
});

describe("getCountryFromIp", () => {
  it("returns null for empty ip", async () => {
    expect(await getCountryFromIp("")).toBeNull();
  });

  it("returns null for falsy ip", async () => {
    expect(await getCountryFromIp("")).toBeNull();
  });

  it("returns cached value when IP is cached", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    await getCountryFromIp("1.2.3.4");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockClear();
    expect(await getCountryFromIp("1.2.3.4")).toBe("US");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches from ip-api.com and returns countryCode on success", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const result = await getCountryFromIp("1.2.3.4");
    expect(result).toBe("US");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ip-api.com/json/1.2.3.4?fields=countryCode",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns null when fetch response is not ok, and caches the null", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });
    expect(await getCountryFromIp("1.2.3.4")).toBeNull();
    fetchMock.mockClear();
    expect(await getCountryFromIp("1.2.3.4")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when fetch throws, and caches the null", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    expect(await getCountryFromIp("1.2.3.4")).toBeNull();
    fetchMock.mockClear();
    expect(await getCountryFromIp("1.2.3.4")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caches results for subsequent calls", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(await getCountryFromIp("10.0.0.1")).toBe("US");
    expect(await getCountryFromIp("10.0.0.2")).toBe("US");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockClear();
    expect(await getCountryFromIp("10.0.0.1")).toBe("US");
    expect(await getCountryFromIp("10.0.0.2")).toBe("US");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("evicts oldest entry when cache exceeds MAX_CACHE_SIZE", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    for (let i = 0; i < 1000; i++) {
      await getCountryFromIp(`192.168.0.${i}`);
    }
    fetchMock.mockClear();
    expect(await getCountryFromIp("192.168.0.0")).toBe("US");
    expect(fetchMock).not.toHaveBeenCalled();
    await getCountryFromIp("10.0.0.1");
    fetchMock.mockClear();
    expect(await getCountryFromIp("192.168.0.0")).toBe("US");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("resolveCountry", () => {
  it("returns country from request when available", async () => {
    vi.mocked(geolocation).mockReturnValue({ country: "US" });
    const result = await resolveCountry(mockRequest);
    expect(result).toBe("US");
  });

  it("falls back to IP lookup when request has no country", async () => {
    vi.mocked(geolocation).mockReturnValue({ country: null });
    const result = await resolveCountry(mockRequest, "1.2.3.4");
    expect(result).toBe("US");
  });

  it("returns null when neither request nor ip provided", async () => {
    expect(await resolveCountry()).toBeNull();
  });

  it("returns null when request has no country and IP lookup fails", async () => {
    vi.mocked(geolocation).mockReturnValue({});
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    expect(await resolveCountry(mockRequest, "1.2.3.4")).toBeNull();
  });

  it("calls getCountryFromIp when no request but ip provided", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const result = await resolveCountry(undefined, "1.2.3.4");
    expect(result).toBe("US");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ip-api.com/json/1.2.3.4?fields=countryCode",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("prioritizes request over ip when both provided", async () => {
    vi.mocked(geolocation).mockReturnValue({ country: "US" });
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(await resolveCountry(mockRequest, "1.2.3.4")).toBe("US");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
