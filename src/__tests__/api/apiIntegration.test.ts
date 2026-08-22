import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import { hashPassword } from "@/lib/session";
import { startTestServer, stopTestServer, BASE_URL, extractSessionCookie } from "../testServer";

const TEST_TAG = `apitest-${Date.now()}`;

let adminCookie: string;
let supervisorCookie: string;
let regularUserCookie: string;
let regularUserId: string;
let seedPlateId: string;
let createdUserIds: string[] = [];

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
  const supervisor = await User.create({
    name: `${TEST_TAG}-supervisor`,
    phone: `05${(Date.now() + 1).toString().slice(-8)}`,
    passwordHash,
    role: "supervisor",
    permissions: ["auction:create", "auction:manage"],
  });
  const regularUser = await User.create({
    name: `${TEST_TAG}-user`,
    phone: `05${(Date.now() + 2).toString().slice(-8)}`,
    passwordHash,
    role: "user",
  });
  regularUserId = String(regularUser._id);
  createdUserIds = [String(admin._id), String(supervisor._id), regularUserId];

  const adminLogin = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone: admin.phone, password: "Test@12345" }),
  });
  adminCookie = extractSessionCookie(adminLogin.res);

  const supervisorLogin = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone: supervisor.phone, password: "Test@12345" }),
  });
  supervisorCookie = extractSessionCookie(supervisorLogin.res);

  const userLogin = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone: regularUser.phone, password: "Test@12345" }),
  });
  regularUserCookie = extractSessionCookie(userLogin.res);

  const plate = await Plate.create({
    type: "private",
    lettersAr: "أ ب ت",
    lettersEn: "ABT",
    numbers: "5501",
    logo: null,
    createdBy: admin._id,
  });
  seedPlateId = String(plate._id);
}, 40_000);

afterAll(async () => {
  await Auction.deleteMany({ plate: seedPlateId });
  await Plate.deleteOne({ _id: seedPlateId });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await stopTestServer();
  await mongoose.disconnect();
}, 15_000);

describe("health endpoint", () => {
  it("reports ok with database connected", async () => {
    const { status, body } = await api("/api/health");
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });
});

describe("auth", () => {
  it("rejects login with wrong password", async () => {
    const { status, body } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone: "0599999999", password: "wrong" }),
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("returns the current user for /api/auth/me with a valid session", async () => {
    const { status, body } = await api("/api/auth/me", { cookie: regularUserCookie });
    expect(status).toBe(200);
    expect(body.data.id).toBe(regularUserId);
  });

  it("rejects /api/auth/me without a session", async () => {
    const { status } = await api("/api/auth/me");
    expect(status).toBe(401);
  });
});

describe("RBAC — plates", () => {
  it("regular user cannot mark a plate as VIP (plate:create_featured required)", async () => {
    const { status, body } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "س ص ع", lettersEn: "SSE", numbers: "1", logo: null, isVip: true }),
    });
    expect(status).toBe(403);
    expect(body.code).toBe("forbidden");
  });

  it("regular user can create a non-VIP plate (ordinary consumer action)", async () => {
    const { status, body } = await api("/api/plates", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ type: "private", lettersAr: "ك ل م", lettersEn: "KLM", numbers: "77", logo: null }),
    });
    expect(status).toBe(201);
    await Plate.deleteOne({ _id: body.data._id });
  });

  it("supervisor without plate:manage cannot update a plate", async () => {
    const { status } = await api(`/api/plates/${seedPlateId}`, {
      method: "PATCH",
      cookie: supervisorCookie,
      body: JSON.stringify({ isVisible: false }),
    });
    expect(status).toBe(403);
  });

  it("admin can update a plate", async () => {
    const { status } = await api(`/api/plates/${seedPlateId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: JSON.stringify({ isFeatured: true }),
    });
    expect(status).toBe(200);
  });
});

describe("RBAC — auctions", () => {
  it("regular user cannot create an auction", async () => {
    const { status } = await api("/api/auctions", {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({
        plate: seedPlateId,
        startingPrice: 1000,
        minIncrement: 100,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    expect(status).toBe(403);
  });

  it("supervisor with auction:create can create an auction", async () => {
    const { status, body } = await api("/api/auctions", {
      method: "POST",
      cookie: supervisorCookie,
      body: JSON.stringify({
        plate: seedPlateId,
        startingPrice: 1000,
        minIncrement: 100,
        startAt: new Date(Date.now() - 1000).toISOString(),
        endAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    expect(status).toBe(201);
    expect(body.data.status).toBe("live");
  });

  it("supervisor without auction:manage-equivalent on a fresh grant set cannot change status incorrectly (manual sold rejected)", async () => {
    const created = await api("/api/auctions", {
      method: "POST",
      cookie: supervisorCookie,
      body: JSON.stringify({
        plate: seedPlateId,
        startingPrice: 500,
        minIncrement: 50,
        startAt: new Date(Date.now() - 1000).toISOString(),
        endAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    const auctionId = created.body.data._id;

    const { status, body } = await api(`/api/auctions/${auctionId}`, {
      method: "PATCH",
      cookie: supervisorCookie,
      body: JSON.stringify({ status: "sold" }),
    });
    expect(status).toBe(400);
    expect(body.message).toMatch(/نتيجة المزاد يدويًا/);
  });
});

describe("bidding via API", () => {
  it("rejects a bid from an unauthenticated request", async () => {
    const created = await api("/api/auctions", {
      method: "POST",
      cookie: supervisorCookie,
      body: JSON.stringify({
        plate: seedPlateId,
        startingPrice: 1000,
        minIncrement: 100,
        startAt: new Date(Date.now() - 1000).toISOString(),
        endAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    const auctionId = created.body.data._id;

    const { status } = await api(`/api/auctions/${auctionId}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount: 1100 }),
    });
    expect(status).toBe(401);
  });

  it("accepts a valid bid from an authenticated user and rejects a below-increment follow-up", async () => {
    const created = await api("/api/auctions", {
      method: "POST",
      cookie: supervisorCookie,
      body: JSON.stringify({
        plate: seedPlateId,
        startingPrice: 1000,
        minIncrement: 100,
        startAt: new Date(Date.now() - 1000).toISOString(),
        endAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    const auctionId = created.body.data._id;

    const validBid = await api(`/api/auctions/${auctionId}/bids`, {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ amount: 1100 }),
    });
    expect(validBid.status).toBe(200);
    expect(validBid.body.data.accepted).toBe(true);

    const lowBid = await api(`/api/auctions/${auctionId}/bids`, {
      method: "POST",
      cookie: regularUserCookie,
      body: JSON.stringify({ amount: 1120 }),
    });
    expect(lowBid.status).toBe(409);
  });
});

describe("stats and users endpoints require permission", () => {
  it("regular user cannot access /api/stats", async () => {
    const { status } = await api("/api/stats", { cookie: regularUserCookie });
    expect(status).toBe(403);
  });

  it("admin can access /api/stats", async () => {
    const { status, body } = await api("/api/stats", { cookie: adminCookie });
    expect(status).toBe(200);
    expect(typeof body.data.totalUsers).toBe("number");
  });

  it("regular user cannot list users", async () => {
    const { status } = await api("/api/users", { cookie: regularUserCookie });
    expect(status).toBe(403);
  });

  it("admin can list users", async () => {
    const { status, body } = await api("/api/users", { cookie: adminCookie });
    expect(status).toBe(200);
    expect(Array.isArray(body.data.items)).toBe(true);
  });
});
