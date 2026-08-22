import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { hashPassword } from "@/lib/session";
import { startTestServer, stopTestServer, BASE_URL, extractSessionCookie } from "../testServer";
import { runPlateLogoMigration } from "../../../server/migratePlateLogos";

const TEST_TAG = `logotest-${Date.now()}`;

let adminCookie: string;
let adminUserId: string;
let supervisorNoPermCookie: string;
let supervisorWithPermCookie: string;
let regularUserCookie: string;
let createdUserIds: string[] = [];
const createdLogoIds: string[] = [];
const createdPlateIds: string[] = [];

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

function logoPayload(suffix: string) {
  return {
    nameAr: `شعار اختبار ${suffix}`,
    nameEn: `Test Logo ${suffix}`,
    image: `/uploads/plate-logos/${TEST_TAG}-${suffix}.webp`,
    isActive: true,
    sortOrder: 1,
  };
}

beforeAll(async () => {
  await startTestServer();
  await connectDB();

  const passwordHash = await hashPassword("Test@12345");

  const admin = await User.create({
    name: `${TEST_TAG}-admin`,
    phone: `05${Date.now().toString().slice(-8)}`,
    passwordHash,
    role: "admin",
  });
  const supervisorNoPerm = await User.create({
    name: `${TEST_TAG}-sup-noperm`,
    phone: `05${(Date.now() + 1).toString().slice(-8)}`,
    passwordHash,
    role: "supervisor",
    permissions: [],
  });
  const supervisorWithPerm = await User.create({
    name: `${TEST_TAG}-sup-perm`,
    phone: `05${(Date.now() + 2).toString().slice(-8)}`,
    passwordHash,
    role: "supervisor",
    permissions: ["plate_logo:manage"],
  });
  const regularUser = await User.create({
    name: `${TEST_TAG}-user`,
    phone: `05${(Date.now() + 3).toString().slice(-8)}`,
    passwordHash,
    role: "user",
  });
  adminUserId = String(admin._id);
  createdUserIds = [adminUserId, String(supervisorNoPerm._id), String(supervisorWithPerm._id), String(regularUser._id)];

  const adminLogin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone: admin.phone, password: "Test@12345" }) });
  adminCookie = extractSessionCookie(adminLogin.res);

  const supNoPermLogin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone: supervisorNoPerm.phone, password: "Test@12345" }) });
  supervisorNoPermCookie = extractSessionCookie(supNoPermLogin.res);

  const supWithPermLogin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone: supervisorWithPerm.phone, password: "Test@12345" }) });
  supervisorWithPermCookie = extractSessionCookie(supWithPermLogin.res);

  const userLogin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone: regularUser.phone, password: "Test@12345" }) });
  regularUserCookie = extractSessionCookie(userLogin.res);
}, 40_000);

afterAll(async () => {
  await Plate.deleteMany({ _id: { $in: createdPlateIds } });
  await PlateLogo.deleteMany({ _id: { $in: createdLogoIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await stopTestServer();
  await mongoose.disconnect();
}, 15_000);

describe("Plate Logo permissions", () => {
  it("regular user cannot create a plate logo", async () => {
    const { status } = await api("/api/plate-logos", { method: "POST", cookie: regularUserCookie, body: JSON.stringify(logoPayload("perm-user")) });
    expect(status).toBe(403);
  });

  it("supervisor without plate_logo:manage cannot create a plate logo", async () => {
    const { status } = await api("/api/plate-logos", { method: "POST", cookie: supervisorNoPermCookie, body: JSON.stringify(logoPayload("perm-sup-no")) });
    expect(status).toBe(403);
  });

  it("supervisor with plate_logo:manage can create a plate logo", async () => {
    const { status, body } = await api("/api/plate-logos", { method: "POST", cookie: supervisorWithPermCookie, body: JSON.stringify(logoPayload("perm-sup-yes")) });
    expect(status).toBe(201);
    createdLogoIds.push(body.data._id);
  });

  it("admin can create a plate logo", async () => {
    const { status, body } = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("perm-admin")) });
    expect(status).toBe(201);
    createdLogoIds.push(body.data._id);
  });

  it("unauthenticated request cannot create a plate logo", async () => {
    const { status } = await api("/api/plate-logos", { method: "POST", body: JSON.stringify(logoPayload("perm-anon")) });
    expect(status).toBe(401);
  });
});

describe("Plate Logo CRUD", () => {
  it("creates a logo and lists it in the public GET (active by default)", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("crud-create")) });
    expect(created.status).toBe(201);
    createdLogoIds.push(created.body.data._id);

    const { status, body } = await api("/api/plate-logos");
    expect(status).toBe(200);
    const ids = body.data.items.map((i: { _id: string }) => i._id);
    expect(ids).toContain(created.body.data._id);
  });

  it("updates a logo's fields", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("crud-update")) });
    createdLogoIds.push(created.body.data._id);

    const { status, body } = await api(`/api/plate-logos/${created.body.data._id}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: JSON.stringify({ nameAr: "اسم محدث", sortOrder: 9 }),
    });
    expect(status).toBe(200);
    expect(body.data.nameAr).toBe("اسم محدث");
    expect(body.data.sortOrder).toBe(9);
  });

  it("deactivates and reactivates a logo, affecting the public active-only list", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("crud-toggle")) });
    const id = created.body.data._id;
    createdLogoIds.push(id);

    const deactivated = await api(`/api/plate-logos/${id}`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ isActive: false }) });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.isActive).toBe(false);

    const listAfterDeactivate = await api("/api/plate-logos");
    const idsAfterDeactivate = listAfterDeactivate.body.data.items.map((i: { _id: string }) => i._id);
    expect(idsAfterDeactivate).not.toContain(id);

    const reactivated = await api(`/api/plate-logos/${id}`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ isActive: true }) });
    expect(reactivated.status).toBe(200);

    const listAfterReactivate = await api("/api/plate-logos");
    const idsAfterReactivate = listAfterReactivate.body.data.items.map((i: { _id: string }) => i._id);
    expect(idsAfterReactivate).toContain(id);
  });

  it("deletes an unused logo", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("crud-delete-unused")) });
    const id = created.body.data._id;

    const { status, body } = await api(`/api/plate-logos/${id}`, { method: "DELETE", cookie: adminCookie });
    expect(status).toBe(200);
    expect(body.data.success).toBe(true);

    const stillExists = await PlateLogo.findById(id);
    expect(stillExists).toBeNull();
  });

  it("rejects deleting a logo currently referenced by a plate", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("crud-delete-used")) });
    const logoId = created.body.data._id;
    createdLogoIds.push(logoId);

    const plate = await Plate.create({
      type: "private",
      lettersAr: "س ع د",
      lettersEn: "SAD",
      numbers: "4021",
      logo: logoId,
      createdBy: adminUserId,
    });
    createdPlateIds.push(String(plate._id));

    const { status, body } = await api(`/api/plate-logos/${logoId}`, { method: "DELETE", cookie: adminCookie });
    expect(status).toBe(409);
    expect(body.message).toMatch(/مستخدم/);

    const stillExists = await PlateLogo.findById(logoId);
    expect(stillExists).not.toBeNull();
  });
});

describe("Plate creation with logo", () => {
  it("creates a plate with a valid active logo", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("plate-valid")) });
    const logoId = created.body.data._id;
    createdLogoIds.push(logoId);

    const { status, body } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "أ أ أ", lettersEn: "AAA", numbers: "1001", logo: logoId }),
    });
    expect(status).toBe(201);
    createdPlateIds.push(body.data._id);
    expect(String(body.data.logo?._id ?? body.data.logo)).toBe(logoId);
  });

  it("creates a plate with no logo (null)", async () => {
    const { status, body } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "ب ب ب", lettersEn: "BBB", numbers: "1002", logo: null }),
    });
    expect(status).toBe(201);
    createdPlateIds.push(body.data._id);
    expect(body.data.logo).toBeNull();
  });

  it("rejects a plate creation referencing an inactive logo", async () => {
    const created = await api("/api/plate-logos", { method: "POST", cookie: adminCookie, body: JSON.stringify(logoPayload("plate-inactive")) });
    const logoId = created.body.data._id;
    createdLogoIds.push(logoId);
    await api(`/api/plate-logos/${logoId}`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ isActive: false }) });

    const { status, body } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "ج ج ج", lettersEn: "CCC", numbers: "1003", logo: logoId }),
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("rejects a plate creation referencing a non-existent logo id", async () => {
    const bogusId = new mongoose.Types.ObjectId().toString();
    const { status } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "د د د", lettersEn: "DDD", numbers: "1004", logo: bogusId }),
    });
    expect(status).toBe(400);
  });

  it("rejects a malformed (non-ObjectId) logo value", async () => {
    const { status } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "هـ هـ هـ", lettersEn: "EEE", numbers: "1005", logo: "not-an-id" }),
    });
    // Zod validation failures are mapped to 422 across this API (see
    // handleApiError in src/lib/api.ts), not 400.
    expect(status).toBe(422);
  });
});

describe("Legacy plate-logo migration", () => {
  // These legacySlug specs (vision, diriyah, ...) are the real, permanent
  // catalog entries also used by the live app — ensureLegacyPlateLogo()
  // finds-and-reuses them by legacySlug rather than creating throwaway
  // records, so cleanup here must only remove the *Plate* docs this test
  // created, never the shared PlateLogo records themselves.
  afterAll(async () => {
    await Plate.deleteMany({ lettersEn: { $in: ["MIGA", "MIGB", "MIGC"] } });
  });

  it("maps a legacy 'none' value to null and a recognized slug to a real PlateLogo, idempotently", async () => {
    const nonePlate = await Plate.create({ type: "private", lettersAr: "م م م", lettersEn: "MIGA", numbers: "2001", logo: null, createdBy: adminUserId });
    await Plate.collection.updateOne({ _id: nonePlate._id }, { $set: { logo: "none" } });

    const visionPlate = await Plate.create({ type: "private", lettersAr: "ن ن ن", lettersEn: "MIGB", numbers: "2002", logo: null, createdBy: adminUserId });
    await Plate.collection.updateOne({ _id: visionPlate._id }, { $set: { logo: "vision" } });

    const unknownPlate = await Plate.create({ type: "private", lettersAr: "هـ و هـ", lettersEn: "MIGC", numbers: "2003", logo: null, createdBy: adminUserId });
    await Plate.collection.updateOne({ _id: unknownPlate._id }, { $set: { logo: "some_unknown_legacy_value" } });

    const firstRun = await runPlateLogoMigration();
    expect(firstRun.platesUpdated).toBeGreaterThanOrEqual(3);
    expect(firstRun.unrecognized).toContain("some_unknown_legacy_value");

    const noneAfter = await Plate.findById(nonePlate._id).lean<{ logo: unknown }>();
    expect(noneAfter?.logo).toBeNull();

    const unknownAfter = await Plate.findById(unknownPlate._id).lean<{ logo: unknown }>();
    expect(unknownAfter?.logo).toBeNull();

    const visionAfter = await Plate.findById(visionPlate._id).lean<{ logo: mongoose.Types.ObjectId | null }>();
    expect(visionAfter?.logo).not.toBeNull();
    const visionLogoDoc = await PlateLogo.findById(visionAfter!.logo);
    expect(visionLogoDoc?.legacySlug).toBe("vision");

    createdPlateIds.push(String(nonePlate._id), String(visionPlate._id), String(unknownPlate._id));

    const secondRun = await runPlateLogoMigration();
    expect(secondRun.plateCandidates).toBe(0);
    expect(secondRun.platesUpdated).toBe(0);
    expect(secondRun.logosCreated).toBe(0);

    const visionLogoCountAfterRerun = await PlateLogo.countDocuments({ legacySlug: "vision" });
    expect(visionLogoCountAfterRerun).toBe(1);
  }, 30_000);
});
