import { describe, expect, it } from "vitest";
import { 
  simulateMissingBureauScores, 
  calculateOptimalPaymentDate,
  calculateAllPaymentDates,
  estimateStatementDate 
} from "./bureauSimulator";

describe("Bureau Simulator", () => {
  it("simulates missing bureau scores with realistic variance", () => {
    const result = simulateMissingBureauScores('experian', 720, 5);
    
    expect(result).toHaveLength(3);
    expect(result.find(b => b.bureau === 'experian')?.isSimulated).toBe(false);
    expect(result.find(b => b.bureau === 'experian')?.score).toBe(720);
    
    const equifax = result.find(b => b.bureau === 'equifax');
    const transunion = result.find(b => b.bureau === 'transunion');
    
    expect(equifax?.isSimulated).toBe(true);
    expect(transunion?.isSimulated).toBe(true);
    
    // Scores should be within reasonable range (±50 points)
    expect(equifax?.score).toBeGreaterThan(670);
    expect(equifax?.score).toBeLessThan(770);
    expect(transunion?.score).toBeGreaterThan(670);
    expect(transunion?.score).toBeLessThan(770);
  });

  it("marks actual bureau score as not simulated", () => {
    const result = simulateMissingBureauScores('equifax', 750, 10);
    
    const actualScore = result.find(b => b.bureau === 'equifax');
    expect(actualScore?.isSimulated).toBe(false);
    expect(actualScore?.confidence).toBe('high');
    expect(actualScore?.notes).toContain('Actual');
  });

  it("adjusts confidence based on account count", () => {
    const lowAccounts = simulateMissingBureauScores('experian', 700, 2);
    const highAccounts = simulateMissingBureauScores('experian', 700, 15);
    
    const lowSimulated = lowAccounts.find(b => b.bureau === 'equifax');
    const highSimulated = highAccounts.find(b => b.bureau === 'equifax');
    
    expect(lowSimulated?.confidence).toBe('low');
    expect(highSimulated?.confidence).toBe('high');
  });
});

describe("Payment Date Calculator", () => {
  it("calculates optimal payment date 4 days before statement", () => {
    const statementDate = new Date('2024-03-15');
    const dueDate = new Date('2024-04-05');
    
    const result = calculateOptimalPaymentDate(
      'Chase Sapphire',
      statementDate,
      dueDate,
      5000,
      10000,
      5000
    );
    
    const expectedDate = new Date('2024-03-11'); // 4 days before statement
    expect(result.optimalPaymentDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it("calculates utilization impact correctly", () => {
    const result = calculateOptimalPaymentDate(
      'Test Card',
      new Date('2024-03-15'),
      new Date('2024-04-05'),
      5000,
      10000,
      3000
    );
    
    expect(result.utilizationImpact.current).toBe(50);
    expect(result.utilizationImpact.afterPayment).toBe(20);
    expect(result.utilizationImpact.improvement).toBe(30);
  });

  it("provides reasoning for high utilization", () => {
    const result = calculateOptimalPaymentDate(
      'Test Card',
      new Date('2024-03-15'),
      new Date('2024-04-05'),
      8000,
      10000,
      8000
    );
    
    expect(result.reasoning).toContain('high');
    expect(result.reasoning).toContain('80.0%');
  });

  it("handles full balance payment", () => {
    const result = calculateOptimalPaymentDate(
      'Test Card',
      new Date('2024-03-15'),
      new Date('2024-04-05'),
      3000,
      10000,
      0 // No planned payment specified = pay full balance
    );
    
    expect(result.utilizationImpact.afterPayment).toBe(0);
  });

  it("calculates payment window correctly", () => {
    const statementDate = new Date('2024-03-15');
    
    const result = calculateOptimalPaymentDate(
      'Test Card',
      statementDate,
      new Date('2024-04-05'),
      5000,
      10000,
      5000
    );
    
    const expectedStart = new Date('2024-03-10'); // 5 days before
    const expectedEnd = new Date('2024-03-13'); // 2 days before
    
    expect(result.optimalPaymentWindow.start.toDateString()).toBe(expectedStart.toDateString());
    expect(result.optimalPaymentWindow.end.toDateString()).toBe(expectedEnd.toDateString());
  });
});

describe("Payment Date Utilities", () => {
  it("estimates statement date from due date", () => {
    const dueDate = new Date('2024-04-05');
    const estimated = estimateStatementDate(dueDate);
    
    const expectedStatement = new Date('2024-03-13'); // 23 days before
    expect(estimated.toDateString()).toBe(expectedStatement.toDateString());
  });

  it("calculates all payment dates for multiple accounts", () => {
    const accounts = [
      {
        name: 'Card 1',
        statementDate: new Date('2024-03-15'),
        dueDate: new Date('2024-04-05'),
        currentBalance: 5000,
        creditLimit: 10000,
      },
      {
        name: 'Card 2',
        statementDate: new Date('2024-03-20'),
        dueDate: new Date('2024-04-10'),
        currentBalance: 2000,
        creditLimit: 5000,
      },
    ];
    
    const results = calculateAllPaymentDates(accounts);
    
    expect(results).toHaveLength(2);
    expect(results[0].accountName).toBe('Card 1'); // Earlier date comes first
    expect(results[1].accountName).toBe('Card 2');
  });
});
