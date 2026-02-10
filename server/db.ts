import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  creditScores, InsertCreditScore,
  creditReports, InsertCreditReport,
  accounts, InsertAccount,
  inquiries, InsertInquiry,
  publicRecords, InsertPublicRecord,
  disputes, InsertDispute,
  documents, InsertDocument,
  tasks, InsertTask,
  privacyActions, InsertPrivacyAction,
  wayfinderScenarios, InsertWayfinderScenario,
  milestones, InsertMilestone,
  scoreGoals, InsertScoreGoal
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Operations ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Credit Score Operations ============

export async function createCreditScore(score: InsertCreditScore) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(creditScores).values(score);
  return result;
}

export async function getCreditScoresByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(creditScores)
    .where(eq(creditScores.userId, userId))
    .orderBy(desc(creditScores.scoreDate));
}

export async function getLatestScoresByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get latest score for each bureau
  const scores = await db.select().from(creditScores)
    .where(eq(creditScores.userId, userId))
    .orderBy(desc(creditScores.scoreDate));
  
  const latestByBureau: Record<string, typeof scores[0]> = {};
  for (const score of scores) {
    if (!latestByBureau[score.bureau]) {
      latestByBureau[score.bureau] = score;
    }
  }
  
  return Object.values(latestByBureau);
}

// ============ Credit Report Operations ============

export async function createCreditReport(report: InsertCreditReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(creditReports).values(report);
  return result;
}

export async function getCreditReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(creditReports)
    .where(eq(creditReports.userId, userId))
    .orderBy(desc(creditReports.reportDate));
}

export async function updateCreditReport(id: number, updates: Partial<InsertCreditReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(creditReports)
    .set(updates)
    .where(eq(creditReports.id, id));
}

// ============ Account Operations ============

export async function createAccount(account: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(accounts).values(account);
  return result;
}

export async function getAccountsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(desc(accounts.updatedAt));
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);
  return result[0];
}

export async function updateAccount(id: number, updates: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(accounts)
    .set(updates)
    .where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(accounts).where(eq(accounts.id, id));
}

// ============ Inquiry Operations ============

export async function createInquiry(inquiry: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(inquiries).values(inquiry);
  return result;
}

export async function getInquiriesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(inquiries)
    .where(eq(inquiries.userId, userId))
    .orderBy(desc(inquiries.inquiryDate));
}

// ============ Public Record Operations ============

export async function createPublicRecord(record: InsertPublicRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(publicRecords).values(record);
  return result;
}

export async function getPublicRecordsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(publicRecords)
    .where(eq(publicRecords.userId, userId))
    .orderBy(desc(publicRecords.createdAt));
}

// ============ Dispute Operations ============

export async function createDispute(dispute: InsertDispute) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(disputes).values(dispute);
  return result;
}

export async function getDisputesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(disputes)
    .where(eq(disputes.userId, userId))
    .orderBy(desc(disputes.updatedAt));
}

export async function getDisputeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(disputes)
    .where(eq(disputes.id, id))
    .limit(1);
  return result[0];
}

export async function updateDispute(id: number, updates: Partial<InsertDispute>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(disputes)
    .set(updates)
    .where(eq(disputes.id, id));
}

export async function deleteDispute(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(disputes).where(eq(disputes.id, id));
}

// ============ Document Operations ============

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documents).values(document);
  return result;
}

export async function getDocumentsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentsByCategory(userId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documents)
    .where(and(
      eq(documents.userId, userId),
      eq(documents.category, category as any)
    ))
    .orderBy(desc(documents.createdAt));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(documents).where(eq(documents.id, id));
}

// ============ Task Operations ============

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tasks).values(task);
  return result;
}

export async function getTasksByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.dueDate));
}

export async function updateTask(id: number, updates: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(tasks)
    .set(updates)
    .where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(tasks).where(eq(tasks.id, id));
}

// ============ Privacy Action Operations ============

export async function createPrivacyAction(action: InsertPrivacyAction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(privacyActions).values(action);
  return result;
}

export async function getPrivacyActionsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(privacyActions)
    .where(eq(privacyActions.userId, userId))
    .orderBy(desc(privacyActions.actionDate));
}

export async function updatePrivacyAction(id: number, updates: Partial<InsertPrivacyAction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(privacyActions)
    .set(updates)
    .where(eq(privacyActions.id, id));
}

// ============ Wayfinder Scenario Operations ============

export async function createWayfinderScenario(scenario: InsertWayfinderScenario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(wayfinderScenarios).values(scenario);
  return result;
}

export async function getWayfinderScenariosByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(wayfinderScenarios)
    .where(eq(wayfinderScenarios.userId, userId))
    .orderBy(desc(wayfinderScenarios.createdAt));
}

export async function deleteWayfinderScenario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(wayfinderScenarios).where(eq(wayfinderScenarios.id, id));
}

// ============ Milestone Operations ============

export async function createMilestone(milestone: InsertMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(milestones).values(milestone);
  return result;
}

export async function getMilestonesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(milestones)
    .where(eq(milestones.userId, userId))
    .orderBy(desc(milestones.achievedDate));
}

// ============ Score Goal Operations ============

export async function createScoreGoal(goal: InsertScoreGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scoreGoals).values(goal);
  return result;
}

export async function getScoreGoalsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(scoreGoals)
    .where(eq(scoreGoals.userId, userId))
    .orderBy(desc(scoreGoals.createdAt));
}

export async function updateScoreGoal(id: number, updates: Partial<InsertScoreGoal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(scoreGoals)
    .set(updates)
    .where(eq(scoreGoals.id, id));
}

export async function deleteScoreGoal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(scoreGoals).where(eq(scoreGoals.id, id));
}
