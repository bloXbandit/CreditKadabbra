import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Credit scores tracking across three bureaus
 */
export const creditScores = mysqlTable("credit_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  score: int("score").notNull(),
  scoreDate: date("scoreDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditScore = typeof creditScores.$inferSelect;
export type InsertCreditScore = typeof creditScores.$inferInsert;

/**
 * Credit reports uploaded by users
 */
export const creditReports = mysqlTable("credit_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  reportDate: date("reportDate").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  parsed: boolean("parsed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditReport = typeof creditReports.$inferSelect;
export type InsertCreditReport = typeof creditReports.$inferInsert;

/**
 * Credit accounts from parsed reports
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportId: int("reportId"),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 100 }),
  accountType: mysqlEnum("accountType", ["revolving", "installment", "mortgage", "other"]).notNull(),
  status: varchar("status", { length: 100 }),
  balance: decimal("balance", { precision: 12, scale: 2 }),
  creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }),
  paymentStatus: varchar("paymentStatus", { length: 100 }),
  openDate: date("openDate"),
  lastPaymentDate: date("lastPaymentDate"),
  statementDate: date("statementDate"),
  isDisputed: boolean("isDisputed").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Credit inquiries
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportId: int("reportId"),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  creditorName: varchar("creditorName", { length: 255 }).notNull(),
  inquiryDate: date("inquiryDate").notNull(),
  inquiryType: mysqlEnum("inquiryType", ["hard", "soft"]).notNull(),
  isDisputed: boolean("isDisputed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * Public records (bankruptcies, liens, judgments)
 */
export const publicRecords = mysqlTable("public_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportId: int("reportId"),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  recordType: varchar("recordType", { length: 100 }).notNull(),
  filingDate: date("filingDate"),
  status: varchar("status", { length: 100 }),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  description: text("description"),
  isDisputed: boolean("isDisputed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicRecord = typeof publicRecords.$inferSelect;
export type InsertPublicRecord = typeof publicRecords.$inferInsert;

/**
 * Disputes filed by users
 */
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  itemType: mysqlEnum("itemType", ["account", "inquiry", "public_record", "personal_info"]).notNull(),
  itemId: int("itemId"),
  disputeReason: text("disputeReason").notNull(),
  letterContent: text("letterContent"),
  status: mysqlEnum("status", ["draft", "sent", "in_progress", "resolved", "rejected"]).default("draft").notNull(),
  dateSent: date("dateSent"),
  dateResolved: date("dateResolved"),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

/**
 * Documents uploaded by users
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["credit_report", "dispute_letter", "bureau_response", "supporting_doc", "other"]).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  relatedDisputeId: int("relatedDisputeId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Tasks and reminders
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("dueDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  completed: boolean("completed").default(false).notNull(),
  relatedDisputeId: int("relatedDisputeId"),
  relatedAccountId: int("relatedAccountId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Privacy actions (opt-outs, data sharing controls)
 */
export const privacyActions = mysqlTable("privacy_actions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureau: mysqlEnum("bureau", ["equifax", "experian", "transunion"]).notNull(),
  actionType: mysqlEnum("actionType", ["opt_out_prescreened", "opt_out_sharing", "limit_sensitive", "freeze", "other"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  actionDate: date("actionDate").notNull(),
  confirmationNumber: varchar("confirmationNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrivacyAction = typeof privacyActions.$inferSelect;
export type InsertPrivacyAction = typeof privacyActions.$inferInsert;

/**
 * Wayfinder scenarios (what-if simulations)
 */
export const wayfinderScenarios = mysqlTable("wayfinder_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scenarioName: varchar("scenarioName", { length: 255 }).notNull(),
  scenarioType: mysqlEnum("scenarioType", ["balance_paydown", "collection_removal", "missed_payment_correction", "inquiry_removal", "custom"]).notNull(),
  currentScore: int("currentScore"),
  projectedScore: int("projectedScore"),
  parameters: text("parameters"), // JSON string with scenario details
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WayfinderScenario = typeof wayfinderScenarios.$inferSelect;
export type InsertWayfinderScenario = typeof wayfinderScenarios.$inferInsert;

/**
 * Milestones for progress tracking
 */
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  milestoneType: varchar("milestoneType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  achievedDate: date("achievedDate").notNull(),
  value: varchar("value", { length: 100 }), // e.g., score reached, items deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

/**
 * Score goals set by users
 */
export const scoreGoals = mysqlTable("score_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetScore: int("targetScore").notNull(),
  targetDate: date("targetDate"),
  achieved: boolean("achieved").default(false).notNull(),
  achievedDate: date("achievedDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoreGoal = typeof scoreGoals.$inferSelect;
export type InsertScoreGoal = typeof scoreGoals.$inferInsert;
