import { describe, it, expect, vi } from "vitest";
import {
  toAuctionDTO,
  toAuctionDTOList,
  toAuctionSummaryDTO,
  toAuctionSummaryDTOList,
  type LeanAuction,
  type LeanPlate,
} from "@/lib/dto";

const mockPlate: LeanPlate = {
  _id: "507f1f77bcf86cd799439011",
  type: "private",
  lettersAr: "أ ب ج",
  lettersEn: "A B J",
  numbers: "1234",
  isVip: true,
  isVisible: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const validAuction: LeanAuction = {
  _id: "607f1f77bcf86cd799439022",
  plate: mockPlate,
  category: "regular",
  status: "live",
  startingPrice: 5000,
  minIncrement: 500,
  currentPrice: 6000,
  startAt: new Date("2026-01-01"),
  endAt: new Date("2026-01-02"),
  directPurchaseEnabled: false,
  bidCount: 2,
  createdBy: "507f1f77bcf86cd799439033",
  version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const orphanedAuction: LeanAuction = {
  _id: "607f1f77bcf86cd799439099",
  plate: null as unknown as LeanPlate, // plate deleted / missing
  category: "regular",
  status: "sold",
  startingPrice: 5000,
  minIncrement: 500,
  currentPrice: 8000,
  startAt: new Date("2026-01-01"),
  endAt: new Date("2026-01-02"),
  directPurchaseEnabled: false,
  bidCount: 5,
  createdBy: "507f1f77bcf86cd799439033",
  version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("Auction DTO Resilience & Orphan Handling", () => {
  it("maps auction with valid populated plate successfully", () => {
    const dto = toAuctionDTO(validAuction);
    expect(dto._id).toBe("607f1f77bcf86cd799439022");
    expect(dto.plate.lettersAr).toBe("أ ب ج");
    expect(dto.currentPrice).toBe(6000);
  });

  it("throws informative error including auction ID when toAuctionDTO receives an orphaned auction", () => {
    expect(() => toAuctionDTO(orphanedAuction)).toThrowError(
      /toAuctionDTO: auction 607f1f77bcf86cd799439099 plate must be populated/
    );
  });

  it("toAuctionDTOList safely filters out orphaned auctions without throwing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const list = toAuctionDTOList([validAuction, orphanedAuction]);
    expect(list).toHaveLength(1);
    expect(list[0]._id).toBe("607f1f77bcf86cd799439022");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping orphaned auction 607f1f77bcf86cd799439099")
    );

    warnSpy.mockRestore();
  });

  it("toAuctionSummaryDTO throws informative error when plate is unpopulated", () => {
    expect(() => toAuctionSummaryDTO(orphanedAuction)).toThrowError(
      /toAuctionSummaryDTO: auction 607f1f77bcf86cd799439099 plate must be populated/
    );
  });

  it("toAuctionSummaryDTOList safely filters out orphaned auctions without throwing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const list = toAuctionSummaryDTOList([orphanedAuction, validAuction]);
    expect(list).toHaveLength(1);
    expect(list[0]._id).toBe("607f1f77bcf86cd799439022");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping orphaned auction 607f1f77bcf86cd799439099")
    );

    warnSpy.mockRestore();
  });
});
