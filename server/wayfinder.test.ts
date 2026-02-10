import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("wayfinder simulation", () => {
  it("simulates balance paydown scenario", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wayfinder.simulate({
      scenarioType: "balance_paydown",
      currentScore: 650,
      parameters: {
        utilizationReduction: 30,
      },
    });

    expect(result.currentScore).toBe(650);
    expect(result.projectedScore).toBeGreaterThan(650);
    expect(result.projectedChange).toBeGreaterThan(0);
  });

  it("simulates collection removal scenario", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wayfinder.simulate({
      scenarioType: "collection_removal",
      currentScore: 600,
      parameters: {
        collectionsCount: 2,
      },
    });

    expect(result.currentScore).toBe(600);
    expect(result.projectedScore).toBeGreaterThan(600);
    expect(result.projectedChange).toBeGreaterThanOrEqual(70);
  });

  it("simulates missed payment correction", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wayfinder.simulate({
      scenarioType: "missed_payment_correction",
      currentScore: 620,
      parameters: {
        missedPaymentsCount: 1,
      },
    });

    expect(result.currentScore).toBe(620);
    expect(result.projectedScore).toBeGreaterThan(620);
    expect(result.projectedChange).toBeGreaterThan(0);
  });

  it("simulates inquiry removal scenario", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wayfinder.simulate({
      scenarioType: "inquiry_removal",
      currentScore: 700,
      parameters: {
        inquiriesCount: 3,
      },
    });

    expect(result.currentScore).toBe(700);
    expect(result.projectedScore).toBeGreaterThan(700);
    expect(result.projectedChange).toBeGreaterThan(0);
    expect(result.projectedChange).toBeLessThanOrEqual(15);
  });

  it("caps projected score at 850", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wayfinder.simulate({
      scenarioType: "collection_removal",
      currentScore: 820,
      parameters: {
        collectionsCount: 5,
      },
    });

    expect(result.projectedScore).toBeLessThanOrEqual(850);
  });

  it("creates and stores wayfinder scenario", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const scenario = await caller.wayfinder.create({
      scenarioName: "Test Scenario",
      scenarioType: "balance_paydown",
      currentScore: 680,
      parameters: JSON.stringify({ utilizationReduction: 20 }),
      notes: "Testing scenario creation",
    });

    expect(scenario).toBeDefined();
    // Result is a MySQL insert result, not the inserted row
  });
});
