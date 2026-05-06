import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { listCompanies, companiesCache } from "../../src/tools/listCompanies.js";
import { getCompanyServices, servicesCache } from "../../src/tools/getCompanyServices.js";
import { getAvailableDates } from "../../src/tools/getAvailableDates.js";
import { getAvailableSessions } from "../../src/tools/getAvailableSessions.js";
import { getBookingForm } from "../../src/tools/getBookingForm.js";
import { checkTicketStatus } from "../../src/tools/checkTicketStatus.js";

const mockGet = vi.mocked(filazeroClient.get);

const ITERATIONS = 20;

function p95(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[idx];
}

async function measure(fn: () => Promise<unknown>): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  return times;
}

beforeEach(() => {
  vi.clearAllMocks();
  companiesCache.clear();
  servicesCache.clear();
});

describe("Public tools P95 latency < 2s", () => {
  it("list_companies P95 < 2000ms", async () => {
    mockGet.mockResolvedValue({
      data: {
        companies: [
          { id: "1", slug: "empresa-a", name: "Empresa A" },
          { id: "2", slug: "empresa-b", name: "Empresa B" },
        ],
      },
    });

    const times = await measure(async () => {
      companiesCache.clear();
      await listCompanies.execute({});
    });

    const latency = p95(times);
    expect(latency).toBeLessThan(2000);
  });

  it("get_company_services P95 < 2000ms", async () => {
    mockGet.mockResolvedValue({
      data: {
        services: [
          { id: 1, abstractServiceId: 10, name: "Corte", description: "Corte de cabelo" },
        ],
      },
    });

    const times = await measure(async () => {
      servicesCache.clear();
      await getCompanyServices.execute({ slug: "empresa-a" });
    });

    const latency = p95(times);
    expect(latency).toBeLessThan(2000);
  });

  it("get_available_dates P95 < 2000ms", async () => {
    mockGet.mockResolvedValue({
      data: {
        dates: ["2026-05-10", "2026-05-11", "2026-05-12"],
      },
    });

    const times = await measure(() =>
      getAvailableDates.execute({ slug: "empresa-a", serviceId: 1, year: 2026, month: 5 }),
    );

    const latency = p95(times);
    expect(latency).toBeLessThan(2000);
  });

  it("get_available_sessions P95 < 2000ms", async () => {
    mockGet.mockResolvedValue({
      data: {
        sessions: [
          { id: 1, startTime: "09:00", endTime: "09:30", available: true },
        ],
      },
    });

    const times = await measure(() =>
      getAvailableSessions.execute({ slug: "empresa-a", locationId: 1, serviceId: 1, date: "2026-05-10" }),
    );

    const latency = p95(times);
    expect(latency).toBeLessThan(2000);
  });

  it("get_booking_form P95 < 2000ms", async () => {
    mockGet.mockResolvedValue({
      data: {
        fields: [
          { name: "fullName", type: "text", required: true },
          { name: "email", type: "email", required: true },
        ],
      },
    });

    const times = await measure(() =>
      getBookingForm.execute({ providerId: 1, sessionId: 1 }),
    );

    const latency = p95(times);
    expect(latency).toBeLessThan(2000);
  });

  it("check_ticket_status P95 < 2000ms", async () => {
    mockGet.mockResolvedValue({
      data: {
        data: {
          id: 123,
          status: "CONFIRMED",
          position: 3,
          createdAt: "2026-05-06T10:00:00Z",
          scheduledAt: "2026-05-10T09:00:00Z",
        },
      },
    });

    const times = await measure(() =>
      checkTicketStatus.execute({ accessKey: "ABC123" }),
    );

    const latency = p95(times);
    expect(latency).toBeLessThan(2000);
  });
});
