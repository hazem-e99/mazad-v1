import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Plate } from "@/models/Plate";
import { PlateCategory } from "@/models/PlateCategory";
import { hashPassword } from "@/lib/session";
import { startTestServer, stopTestServer, BASE_URL, extractSessionCookie } from "../testServer";

const TEST_TAG = `listingtest-${Date.now()}`;

let adminCookie: string;
let adminUserId: string;
let supervisorNoPermCookie: string;
let supervisorWithPermCookie: string;
let ownerCookie: string;
let ownerUserId: string;
let otherUserCookie: string;
let otherUserId: string;
const createdUserIds: string[] = [];
const createdPlateIds: string[] = [];
const createdCategoryIds: string[] = [];
let categoryId: string;

async function api(path: string, init: RequestInit & { cookie?: string } = {}) {
  const { cookie, ...rest } = init;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...rest.headers,
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body, res };
}

function listingPayload(overrides: Record<string, unknown> = {}) {
  return {
    type: "private",
    lettersAr: "س ل ع",
    lettersEn: "SLE",
    numbers: "5001",
    title: `عرض اختبار ${Date.now()}`,
    contactPhone: "0509876543",
    submissionType: "marketplace",
    price: 10000,
    image: "/uploads/plates/test-fixture.webp",
    ...overrides,
  };
}

beforeAll(async () => {
  await startTestServer();
  await connectDB();

  const passwordHash = await hashPassword("Test@12345");

  const admin = await User.create({ name: `${TEST_TAG}-admin`, phone: `05${Date.now().toString().slice(-8)}`, passwordHash, role: "admin" });
  adminUserId = String(admin._id);
  const supNoPerm = await User.create({ name: `${TEST_TAG}-sup-no`, phone: `05${(Date.now() + 1).toString().slice(-8)}`, passwordHash, role: "supervisor", permissions: [] });
  const supWithPerm = await User.create({
    name: `${TEST_TAG}-sup-yes`,
    phone: `05${(Date.now() + 2).toString().slice(-8)}`,
    passwordHash,
    role: "supervisor",
    permissions: ["listing:moderate", "ownership_document:view"],
  });
  const owner = await User.create({ name: `${TEST_TAG}-owner`, phone: `05${(Date.now() + 3).toString().slice(-8)}`, passwordHash, role: "user" });
  ownerUserId = String(owner._id);
  const other = await User.create({ name: `${TEST_TAG}-other`, phone: `05${(Date.now() + 4).toString().slice(-8)}`, passwordHash, role: "user" });
  otherUserId = String(other._id);
  createdUserIds.push(adminUserId, String(supNoPerm._id), String(supWithPerm._id), ownerUserId, otherUserId);

  const login = async (phone: string) => {
    const res = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone, password: "Test@12345" }) });
    return extractSessionCookie(res.res);
  };
  adminCookie = await login(admin.phone);
  supervisorNoPermCookie = await login(supNoPerm.phone);
  supervisorWithPermCookie = await login(supWithPerm.phone);
  ownerCookie = await login(owner.phone);
  otherUserCookie = await login(other.phone);

  const category = await PlateCategory.create({ nameAr: "فئة اختبار", nameEn: "Test Category", createdBy: admin._id });
  categoryId = String(category._id);
}, 40_000);

afterAll(async () => {
  await Plate.deleteMany({ _id: { $in: createdPlateIds } });
  await PlateCategory.deleteMany({ _id: { $in: [categoryId, ...createdCategoryIds] } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await stopTestServer();
  await mongoose.disconnect();
}, 15_000);

describe("Listing submission validation", () => {
  it("rejects a marketplace submission with no price", async () => {
    const { status } = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ price: undefined })) });
    expect(status).toBe(422);
  });

  it("accepts a valid marketplace submission and defaults it to pending", async () => {
    const { status, body } = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5002" })) });
    expect(status).toBe(201);
    createdPlateIds.push(body.data._id);

    const doc = await Plate.findById(body.data._id);
    expect(doc?.moderationStatus).toBe("pending");
    expect(doc?.submissionType).toBe("marketplace");
    expect(String(doc?.ownerUser)).toBe(ownerUserId);
  });

  it("accepts a valid auction_request submission without requiring a price", async () => {
    const { status, body } = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5003", submissionType: "auction_request", price: undefined })),
    });
    expect(status).toBe(201);
    createdPlateIds.push(body.data._id);
  });

  it("rejects submission with an inactive/invalid category", async () => {
    const bogusId = new mongoose.Types.ObjectId().toString();
    const { status } = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5004", category: bogusId })) });
    expect(status).toBe(400);
  });

  it("rejects an unauthenticated submission", async () => {
    const { status } = await api("/api/listings", { method: "POST", body: JSON.stringify(listingPayload({ numbers: "5005" })) });
    expect(status).toBe(401);
  });
});

describe("Public visibility", () => {
  it("hides a pending marketplace listing from the public listings feed and detail route", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5010", title: "PENDING-VISIBILITY-TEST" })) });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const list = await api("/api/listings");
    expect(list.body.data.items.some((i: { _id: string }) => i._id === id)).toBe(false);

    const detail = await api(`/api/listings/${id}`);
    expect(detail.status).toBe(404);
  });

  it("shows an approved marketplace listing publicly", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5011", title: "APPROVED-VISIBILITY-TEST" })) });
    const id = created.body.data._id;
    createdPlateIds.push(id);
    await api(`/api/listings/${id}/moderate`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ status: "approved" }) });

    const list = await api("/api/listings");
    expect(list.body.data.items.some((i: { _id: string }) => i._id === id)).toBe(true);

    const detail = await api(`/api/listings/${id}`);
    expect(detail.status).toBe(200);
  });

  it("never shows an approved auction_request through the public marketplace feed", async () => {
    const created = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5012", submissionType: "auction_request", price: undefined, title: "AUCTION-REQUEST-NOT-MARKETPLACE" })),
    });
    const id = created.body.data._id;
    createdPlateIds.push(id);
    await api(`/api/listings/${id}/moderate`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ status: "approved" }) });

    const list = await api("/api/listings");
    expect(list.body.data.items.some((i: { _id: string }) => i._id === id)).toBe(false);
  });

  it("owner can see their own pending listing via the detail route", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5013" })) });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const asOwner = await api(`/api/listings/${id}`, { cookie: ownerCookie });
    expect(asOwner.status).toBe(200);

    const asOther = await api(`/api/listings/${id}`, { cookie: otherUserCookie });
    expect(asOther.status).toBe(404);
  });
});

describe("Moderation permissions and transitions", () => {
  it("regular user cannot moderate a listing", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5020" })) });
    createdPlateIds.push(created.body.data._id);
    const { status } = await api(`/api/listings/${created.body.data._id}/moderate`, { method: "PATCH", cookie: ownerCookie, body: JSON.stringify({ status: "approved" }) });
    expect(status).toBe(403);
  });

  it("supervisor without listing:moderate cannot moderate", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5021" })) });
    createdPlateIds.push(created.body.data._id);
    const { status } = await api(`/api/listings/${created.body.data._id}/moderate`, { method: "PATCH", cookie: supervisorNoPermCookie, body: JSON.stringify({ status: "approved" }) });
    expect(status).toBe(403);
  });

  it("supervisor with listing:moderate can approve", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5022" })) });
    createdPlateIds.push(created.body.data._id);
    const { status, body } = await api(`/api/listings/${created.body.data._id}/moderate`, { method: "PATCH", cookie: supervisorWithPermCookie, body: JSON.stringify({ status: "approved" }) });
    expect(status).toBe(200);
    expect(body.data.moderationStatus).toBe("approved");
  });

  it("rejecting without a reason is rejected by validation", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5023" })) });
    createdPlateIds.push(created.body.data._id);
    const { status } = await api(`/api/listings/${created.body.data._id}/moderate`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ status: "rejected" }) });
    expect(status).toBe(422);
  });

  it("rejects with a reason, then the owner can resubmit (edit) back to pending", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5024" })) });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const rejected = await api(`/api/listings/${id}/moderate`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ status: "rejected", rejectionReason: "بيانات غير مكتملة" }) });
    expect(rejected.status).toBe(200);
    const afterReject = await api(`/api/listings/${id}`, { cookie: ownerCookie });
    expect(afterReject.body.data.moderationStatus).toBe("rejected");
    expect(afterReject.body.data.rejectionReason).toBe("بيانات غير مكتملة");

    const resubmit = await api(`/api/listings/${id}`, { method: "PATCH", cookie: ownerCookie, body: JSON.stringify({ title: "عنوان محدث بعد الرفض" }) });
    expect(resubmit.status).toBe(200);
    expect(resubmit.body.data.moderationStatus).toBe("pending");
    expect(resubmit.body.data.rejectionReason).toBeNull();
  });

  it("rejects an invalid transition (approving an already-approved listing again)", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5025" })) });
    const id = created.body.data._id;
    createdPlateIds.push(id);
    await api(`/api/listings/${id}/moderate`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ status: "approved" }) });

    const { status, body } = await api(`/api/listings/${id}/moderate`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ status: "approved" }) });
    expect(status).toBe(409);
    expect(body.ok).toBe(false);
  });

  it("an unrelated user cannot edit someone else's listing", async () => {
    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5026" })) });
    createdPlateIds.push(created.body.data._id);
    const { status } = await api(`/api/listings/${created.body.data._id}`, { method: "PATCH", cookie: otherUserCookie, body: JSON.stringify({ title: "hijacked" }) });
    expect(status).toBe(403);
  });
});

describe("Ownership document security", () => {
  it("is never present on the public/owner PlateDTO shape, only as a boolean via the listing endpoint for the owner", async () => {
    const created = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5030", ownershipDocument: "ownership-documents/does-not-need-to-exist-for-this-check.webp" })),
    });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const asOwner = await api(`/api/listings/${id}`, { cookie: ownerCookie });
    expect(asOwner.body.data.ownershipDocument).toBeUndefined();
    expect(asOwner.body.data.hasOwnershipDocument).toBe(true);
  });

  it("blocks an unrelated authenticated user from reading the ownership document file", async () => {
    const created = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5031", ownershipDocument: "ownership-documents/fixture.webp" })),
    });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const { status } = await api(`/api/plates/${id}/ownership-document`, { cookie: otherUserCookie });
    expect(status).toBe(403);
  });

  it("blocks an unauthenticated request from reading the ownership document file", async () => {
    const created = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5032", ownershipDocument: "ownership-documents/fixture.webp" })),
    });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const { status } = await api(`/api/plates/${id}/ownership-document`);
    expect(status).toBe(401);
  });

  it("allows a supervisor with ownership_document:view to be authorized (file read fails only because the fixture path has no real bytes)", async () => {
    const created = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5033", ownershipDocument: "ownership-documents/nonexistent-fixture.webp" })),
    });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const { status } = await api(`/api/plates/${id}/ownership-document`, { cookie: supervisorWithPermCookie });
    // Authorized (not 403); the underlying file genuinely doesn't exist on
    // disk for this test fixture, so the route's fs read fails — what
    // matters here is that it is NOT a 403 permission denial.
    expect(status).not.toBe(403);
    expect(status).not.toBe(401);
  });

  it("a supervisor without ownership_document:view (and without plate:manage) is forbidden", async () => {
    const created = await api("/api/listings", {
      method: "POST",
      cookie: ownerCookie,
      body: JSON.stringify(listingPayload({ numbers: "5034", ownershipDocument: "ownership-documents/fixture.webp" })),
    });
    const id = created.body.data._id;
    createdPlateIds.push(id);

    const { status } = await api(`/api/plates/${id}/ownership-document`, { cookie: supervisorNoPermCookie });
    expect(status).toBe(403);
  });
});

describe("Plate category CRUD", () => {
  it("rejects deleting a category currently referenced by a plate", async () => {
    const cat = await api("/api/plate-categories", { method: "POST", cookie: adminCookie, body: JSON.stringify({ nameAr: "فئة مستخدمة", nameEn: "Used Category" }) });
    expect(cat.status).toBe(201);
    createdCategoryIds.push(cat.body.data._id);

    const created = await api("/api/listings", { method: "POST", cookie: ownerCookie, body: JSON.stringify(listingPayload({ numbers: "5040", category: cat.body.data._id })) });
    createdPlateIds.push(created.body.data._id);

    const del = await api(`/api/plate-categories/${cat.body.data._id}`, { method: "DELETE", cookie: adminCookie });
    expect(del.status).toBe(409);

    await api(`/api/plate-categories/${cat.body.data._id}`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ isActive: false }) });
  });
});
