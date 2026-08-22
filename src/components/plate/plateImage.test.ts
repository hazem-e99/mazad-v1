import { describe, expect, it } from "vitest";
import { getPlateImageAsset, PLATE_IMAGE_ASSETS } from "./plateImage";

describe("plate image asset selection", () => {
  it("returns one of the approved license plate images", () => {
    const asset = getPlateImageAsset("THN", "970");

    expect(PLATE_IMAGE_ASSETS).toContain(asset);
  });

  it("stays stable for the same plate data", () => {
    expect(getPlateImageAsset("THN", "970")).toBe(getPlateImageAsset("THN", "970"));
  });
});
