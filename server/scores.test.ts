import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("scores procedures", () => {
  it("creates a credit score successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scores.create({
      bureau: "equifax",
      score: 720,
      scoreDate: "2024-01-15",
      notes: "Test score entry",
    });

    expect(result).toBeDefined();
    // Result is a MySQL insert result, not the inserted row
  });

  it("lists credit scores for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test score first
    await caller.scores.create({
      bureau: "experian",
      score: 750,
      scoreDate: "2024-02-01",
    });

    const scores = await caller.scores.list();
    expect(Array.isArray(scores)).toBe(true);
    expect(scores.length).toBeGreaterThan(0);
  });

  it("retrieves latest scores by bureau", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create multiple scores
    await caller.scores.create({
      bureau: "transunion",
      score: 680,
      scoreDate: "2024-01-01",
    });

    await caller.scores.create({
      bureau: "transunion",
      score: 700,
      scoreDate: "2024-02-01",
    });

    const latestScores = await caller.scores.latest();
    const transunionScore = latestScores.find(s => s.bureau === "transunion");
    
    expect(transunionScore).toBeDefined();
    expect(transunionScore?.score).toBe(700);
  });
});

describe("goals procedures", () => {
  it("creates a score goal successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.create({
      targetScore: 750,
      targetDate: "2024-12-31",
      notes: "Improve credit for mortgage",
    });

    expect(result).toBeDefined();
    // Result is a MySQL insert result, not the inserted row
  });

  it("lists goals for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.goals.create({
      targetScore: 800,
    });

    const goals = await caller.goals.list();
    expect(Array.isArray(goals)).toBe(true);
    expect(goals.length).toBeGreaterThan(0);
  });
});
