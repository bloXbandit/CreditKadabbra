import { describe, expect, it } from "vitest";
import { calculateCreditScore, calculateScoreImpact, type CreditProfile } from "./scoreCalculator";

describe("Credit Score Calculator", () => {
  it("calculates excellent score for perfect credit profile", () => {
    const profile: CreditProfile = {
      accounts: [
        {
          accountType: "credit_card",
          currentBalance: 500,
          creditLimit: 10000,
          status: "current",
          openDate: new Date("2015-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
        {
          accountType: "auto_loan",
          currentBalance: 5000,
          originalAmount: 20000,
          status: "current",
          openDate: new Date("2018-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const result = calculateCreditScore(profile);

    expect(result.score).toBeGreaterThan(700);
    expect(result.grade).toBe("Excellent");
    expect(result.factors.paymentHistory.score).toBeGreaterThan(90);
    expect(result.factors.creditUtilization.score).toBeGreaterThan(90);
  });

  it("penalizes high credit utilization", () => {
    const profile: CreditProfile = {
      accounts: [
        {
          accountType: "credit_card",
          currentBalance: 9000,
          creditLimit: 10000,
          status: "current",
          openDate: new Date("2020-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const result = calculateCreditScore(profile);

    expect(result.factors.creditUtilization.details.overallUtilization).toBe(90);
    expect(result.factors.creditUtilization.score).toBeLessThan(30);
  });

  it("penalizes late payments", () => {
    const profile: CreditProfile = {
      accounts: [
        {
          accountType: "credit_card",
          currentBalance: 1000,
          creditLimit: 10000,
          status: "current",
          openDate: new Date("2020-01-01"),
          monthsReviewed: 24,
          latePayments30: 3,
          latePayments60: 1,
          latePayments90: 1,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const result = calculateCreditScore(profile);

    expect(result.factors.paymentHistory.score).toBeLessThan(80);
    expect(result.factors.paymentHistory.details.latePayments30).toBe(3);
    expect(result.factors.paymentHistory.details.latePayments60).toBe(1);
    expect(result.factors.paymentHistory.details.latePayments90).toBe(1);
  });

  it("calculates score impact of paying down balance", () => {
    const currentProfile: CreditProfile = {
      accounts: [
        {
          accountType: "credit_card",
          currentBalance: 5000,
          creditLimit: 10000,
          status: "current",
          openDate: new Date("2020-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const newProfile: CreditProfile = {
      accounts: [
        {
          ...currentProfile.accounts[0],
          currentBalance: 1000,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const impact = calculateScoreImpact(currentProfile, newProfile);

    expect(impact.impact).toBeGreaterThan(0);
    expect(impact.newScore).toBeGreaterThan(impact.currentScore);
  });

  it("handles accounts with no credit limit", () => {
    const profile: CreditProfile = {
      accounts: [
        {
          accountType: "auto_loan",
          currentBalance: 10000,
          originalAmount: 25000,
          status: "current",
          openDate: new Date("2020-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const result = calculateCreditScore(profile);

    expect(result.score).toBeGreaterThan(300);
    expect(result.score).toBeLessThan(850);
  });

  it("rewards good credit mix", () => {
    const profile: CreditProfile = {
      accounts: [
        {
          accountType: "credit_card",
          currentBalance: 500,
          creditLimit: 10000,
          status: "current",
          openDate: new Date("2015-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
        {
          accountType: "auto_loan",
          currentBalance: 5000,
          originalAmount: 20000,
          status: "current",
          openDate: new Date("2018-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
        {
          accountType: "mortgage",
          currentBalance: 200000,
          originalAmount: 300000,
          status: "current",
          openDate: new Date("2016-01-01"),
          monthsReviewed: 24,
          latePayments30: 0,
          latePayments60: 0,
          latePayments90: 0,
        },
      ],
      inquiries: [],
      publicRecords: [],
    };

    const result = calculateCreditScore(profile);

    expect(result.factors.creditMix.details.hasRevolving).toBe(true);
    expect(result.factors.creditMix.details.hasInstallment).toBe(true);
    expect(result.factors.creditMix.details.hasMortgage).toBe(true);
    expect(result.factors.creditMix.score).toBeGreaterThan(80);
  });
});
