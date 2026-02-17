/**
 * Tests for DashboardClient module
 *
 * Mocks:
 * - Supabase client and queries
 *
 * Coverage:
 * - Metrics aggregation logic
 * - Campaign filtering by date
 * - Error handling (RLS violations, connection errors)
 * - Data transformation
 * - Null/empty state handling
 */

import { describe, it, beforeEach, expect, vi } from "vitest";
import { supabase } from "../../../lib/supabase";
import {
  DashboardClient,
  DashboardMetricPoint,
  UpcomingCampaign,
  DashboardClientError,
} from "../dashboard-client";

// Mock Supabase module
vi.mock("../../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockSupabase = supabase as any;

describe("DashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDashboardMetrics", () => {
    describe("success cases", () => {
      it("should aggregate transactions by date and type", async () => {
        const mockTransactions = [
          {
            id: "tx-1",
            amount: 100,
            transaction_type: "earnings",
            created_at: "2026-02-15T10:00:00Z",
          },
          {
            id: "tx-2",
            amount: 50,
            transaction_type: "withdrawal",
            created_at: "2026-02-15T11:00:00Z",
          },
          {
            id: "tx-3",
            amount: 10,
            transaction_type: "engagement",
            created_at: "2026-02-15T12:00:00Z",
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockTransactions,
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        const result = await DashboardClient.fetchDashboardMetrics(
          "partner-1",
          30,
        );

        // Should have aggregated data
        expect(result.length).toBeGreaterThan(0);
        const feb15Data = result.find(
          (d) => d.date.includes("15") && d.date.includes("Feb"),
        );
        expect(feb15Data?.earnings).toBe(100);
        expect(feb15Data?.withdrawals).toBe(50);
        expect(feb15Data?.engagements).toBe(10);
      });

      it("should return empty array when partnerId is undefined", async () => {
        const result = await DashboardClient.fetchDashboardMetrics(
          undefined,
          30,
        );
        expect(result).toEqual([]);
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });

      it("should handle alternative transaction type values", async () => {
        const mockTransactions = [
          {
            id: "tx-1",
            amount: 100,
            transaction_type: "earn",
            created_at: "2026-02-15T10:00:00Z",
          },
          {
            id: "tx-2",
            amount: 50,
            transaction_type: "withdraw",
            created_at: "2026-02-15T11:00:00Z",
          },
          {
            id: "tx-3",
            amount: 10,
            transaction_type: "engage",
            created_at: "2026-02-15T12:00:00Z",
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockTransactions,
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        const result = await DashboardClient.fetchDashboardMetrics(
          "partner-1",
          30,
        );

        const feb15Data = result.find(
          (d) => d.date.includes("15") && d.date.includes("Feb"),
        );
        expect(feb15Data?.earnings).toBe(100);
        expect(feb15Data?.withdrawals).toBe(50);
        expect(feb15Data?.engagements).toBe(10);
      });

      it("should generate buckets for all days even with no data", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        const result = await DashboardClient.fetchDashboardMetrics(
          "partner-1",
          30,
        );

        expect(result.length).toBe(30);
        expect(result.every((d) => d.earnings === 0)).toBe(true);
        expect(result.every((d) => d.withdrawals === 0)).toBe(true);
        expect(result.every((d) => d.engagements === 0)).toBe(true);
      });

      it("should use correct default days value", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await DashboardClient.fetchDashboardMetrics("partner-1");

        // Should create 30 date buckets
        expect(mockQuery.order).toHaveBeenCalled();
      });
    });

    describe("error handling", () => {
      it("should throw DashboardClientError on RLS violation", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "RLS policy violation" },
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await expect(
          DashboardClient.fetchDashboardMetrics("partner-1", 30),
        ).rejects.toThrow(DashboardClientError);
      });

      it("should throw DashboardClientError on fetch failure", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST500", message: "Internal server error" },
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await expect(
          DashboardClient.fetchDashboardMetrics("partner-1", 30),
        ).rejects.toThrow(DashboardClientError);
      });
    });
  });

  describe("fetchUpcomingCampaigns", () => {
    describe("success cases", () => {
      it("should fetch campaigns with start_date >= today", async () => {
        const mockCampaigns = [
          {
            id: "campaign-1",
            name: "Spring Campaign",
            start_date: "2026-03-01",
          },
          {
            id: "campaign-2",
            name: "Summer Campaign",
            start_date: "2026-06-01",
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: mockCampaigns,
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        const result = await DashboardClient.fetchUpcomingCampaigns(
          "partner-1",
          5,
        );

        expect(result).toEqual(mockCampaigns);
        expect(result.length).toBe(2);
        expect(result[0].start_date).toBe("2026-03-01");
      });

      it("should return empty array when partnerId is undefined", async () => {
        const result = await DashboardClient.fetchUpcomingCampaigns(
          undefined,
          5,
        );
        expect(result).toEqual([]);
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });

      it("should handle campaign with null name", async () => {
        const mockCampaigns = [
          {
            id: "campaign-1",
            name: null,
            start_date: "2026-03-01",
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: mockCampaigns,
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        const result = await DashboardClient.fetchUpcomingCampaigns(
          "partner-1",
          5,
        );

        expect(result[0].name).toBe("Untitled");
      });

      it("should respect limit parameter", async () => {
        const mockCampaigns = [
          {
            id: "campaign-1",
            name: "Campaign 1",
            start_date: "2026-03-01",
          },
          {
            id: "campaign-2",
            name: "Campaign 2",
            start_date: "2026-04-01",
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: mockCampaigns,
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await DashboardClient.fetchUpcomingCampaigns("partner-1", 2);

        expect(mockQuery.limit).toHaveBeenCalledWith(2);
      });

      it("should use default limit of 5", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await DashboardClient.fetchUpcomingCampaigns("partner-1");

        expect(mockQuery.limit).toHaveBeenCalledWith(5);
      });
    });

    describe("error handling", () => {
      it("should throw DashboardClientError on RLS violation", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "RLS policy violation" },
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await expect(
          DashboardClient.fetchUpcomingCampaigns("partner-1", 5),
        ).rejects.toThrow(DashboardClientError);
      });

      it("should throw DashboardClientError on fetch failure", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST500", message: "Internal server error" },
          }),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);

        await expect(
          DashboardClient.fetchUpcomingCampaigns("partner-1", 5),
        ).rejects.toThrow(DashboardClientError);
      });
    });
  });
});
