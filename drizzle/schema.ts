import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, json } from "drizzle-orm/mysql-core";

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
  parsedData: json("parsedData"),
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
  dateClosed: date("dateClosed"),
  highBalance: decimal("highBalance", { precision: 12, scale: 2 }),
  monthlyPayment: decimal("monthlyPayment", { precision: 12, scale: 2 }),
  loanType: varchar("loanType", { length: 100 }),
  responsibility: varchar("responsibility", { length: 100 }),
  creditorAddress: text("creditorAddress"),
  creditorPhone: varchar("creditorPhone", { length: 50 }),
  remarks: text("remarks"),
  paymentHistory: json("paymentHistory"),
  isNegative: boolean("isNegative").default(false).notNull(),
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

/**
 * Alternative credit bureaus (LexisNexis, SageStream, Innovis, ChexSystems, CoreLogic, Clarity)
 */
export const alternativeBureaus = mysqlTable("alternative_bureaus", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  mailAddress: text("mailAddress"),
  reportRequestMethod: varchar("reportRequestMethod", { length: 50 }),
  disputeMethod: varchar("disputeMethod", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlternativeBureau = typeof alternativeBureaus.$inferSelect;
export type InsertAlternativeBureau = typeof alternativeBureaus.$inferInsert;

/**
 * User alternative bureau reports
 */
export const userAlternativeReports = mysqlTable("user_alternative_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureauId: int("bureauId").notNull(),
  requestDate: date("requestDate").notNull(),
  receivedDate: date("receivedDate"),
  status: mysqlEnum("status", ["requested", "received", "reviewed"]).default("requested").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAlternativeReport = typeof userAlternativeReports.$inferSelect;
export type InsertUserAlternativeReport = typeof userAlternativeReports.$inferInsert;

/**
 * Alternative bureau disputes
 */
export const alternativeBureauDisputes = mysqlTable("alternative_bureau_disputes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureauId: int("bureauId").notNull(),
  disputeDate: date("disputeDate").notNull(),
  description: text("description").notNull(),
  letterContent: text("letterContent"),
  status: mysqlEnum("status", ["draft", "submitted", "investigating", "resolved", "rejected"]).default("draft").notNull(),
  resolutionDate: date("resolutionDate"),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlternativeBureauDispute = typeof alternativeBureauDisputes.$inferSelect;
export type InsertAlternativeBureauDispute = typeof alternativeBureauDisputes.$inferInsert;

/**
 * Opt-out tracker for all bureaus
 */
export const optOutTracker = mysqlTable("opt_out_tracker", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureauId: int("bureauId"),
  bureauType: mysqlEnum("bureauType", ["major", "alternative"]).notNull(),
  optOutDate: date("optOutDate").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "expired"]).default("pending").notNull(),
  confirmationNumber: varchar("confirmationNumber", { length: 100 }),
  expirationDate: date("expirationDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OptOutTracker = typeof optOutTracker.$inferSelect;
export type InsertOptOutTracker = typeof optOutTracker.$inferInsert;

/**
 * Security freeze tracker for all bureaus
 */
export const securityFreezeTracker = mysqlTable("security_freeze_tracker", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bureauId: int("bureauId"),
  bureauType: mysqlEnum("bureauType", ["major", "alternative"]).notNull(),
  freezeDate: date("freezeDate").notNull(),
  status: mysqlEnum("status", ["active", "lifted_temp", "lifted_perm", "removed"]).default("active").notNull(),
  pinEncrypted: text("pinEncrypted"), // Encrypted PIN/password
  liftExpiration: timestamp("liftExpiration"), // For temporary lifts
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecurityFreezeTracker = typeof securityFreezeTracker.$inferSelect;
export type InsertSecurityFreezeTracker = typeof securityFreezeTracker.$inferInsert;

/**
 * Live account tracker (user-managed accounts separate from credit reports)
 */
export const liveAccounts = mysqlTable("live_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountType: mysqlEnum("accountType", ["credit_card", "auto_loan", "personal_loan", "student_loan", "mortgage", "other"]).notNull(),
  issuer: varchar("issuer", { length: 255 }),
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }),
  creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }), // For credit cards
  originalAmount: decimal("originalAmount", { precision: 12, scale: 2 }), // For loans
  monthlyPayment: decimal("monthlyPayment", { precision: 10, scale: 2 }),
  minimumPayment: decimal("minimumPayment", { precision: 10, scale: 2 }), // For credit cards
  statementDate: int("statementDate"), // Day of month (1-31)
  paymentDueDate: int("paymentDueDate"), // Day of month (1-31)
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }),
  remainingTerm: int("remainingTerm"), // Months remaining for loans
  status: mysqlEnum("status", ["current", "late", "closed", "paid_off"]).default("current").notNull(),
  propertyAddress: text("propertyAddress"), // For mortgages
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }), // For mortgages
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveAccount = typeof liveAccounts.$inferSelect;
export type InsertLiveAccount = typeof liveAccounts.$inferInsert;

/**
 * Legal citations database
 */
export const legalCitations = mysqlTable("legal_citations", {
  id: int("id").autoincrement().primaryKey(),
  citationType: mysqlEnum("citationType", ["federal", "state", "regulation"]).notNull(),
  statute: varchar("statute", { length: 255 }).notNull(), // e.g., "15 USC § 1681i"
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  fullText: text("fullText"),
  applicableState: varchar("applicableState", { length: 2 }), // For state laws
  errorCategory: varchar("errorCategory", { length: 100 }), // Links to error types
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LegalCitation = typeof legalCitations.$inferSelect;
export type InsertLegalCitation = typeof legalCitations.$inferInsert;

/**
 * Credit report errors detected by automated system
 */
export const creditReportErrors = mysqlTable("credit_report_errors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportId: int("reportId"),
  errorType: mysqlEnum("errorType", [
    "statute_of_limitations",
    "duplicate_account",
    "incorrect_balance",
    "incorrect_status",
    "incorrect_payment_history",
    "unauthorized_inquiry",
    "identity_error",
    "metro2_violation",
    "unverifiable",
    "other"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  itemType: mysqlEnum("itemType", ["account", "inquiry", "public_record", "personal_info"]).notNull(),
  itemId: int("itemId"),
  errorDescription: text("errorDescription").notNull(),
  suggestedAction: text("suggestedAction"),
  legalCitationId: int("legalCitationId"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedDate: date("resolvedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditReportError = typeof creditReportErrors.$inferSelect;
export type InsertCreditReportError = typeof creditReportErrors.$inferInsert;

/**
 * Dispute letter templates
 */
export const disputeLetterTemplates = mysqlTable("dispute_letter_templates", {
  id: int("id").autoincrement().primaryKey(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  errorType: varchar("errorType", { length: 100 }).notNull(),
  bureauType: mysqlEnum("bureauType", ["major", "alternative", "both"]).notNull(),
  templateContent: text("templateContent").notNull(), // Template with placeholders
  legalCitations: text("legalCitations"), // JSON array of citation IDs
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DisputeLetterTemplate = typeof disputeLetterTemplates.$inferSelect;
export type InsertDisputeLetterTemplate = typeof disputeLetterTemplates.$inferInsert;

/**
 * AI chat history for persistent conversations
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  context: text("context"), // JSON string of page context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * User notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  paymentReminders: boolean("paymentReminders").default(true).notNull(),
  paymentReminderDays: int("paymentReminderDays").default(3).notNull(), // Days before optimal payment date
  disputeDeadlines: boolean("disputeDeadlines").default(true).notNull(),
  bureauResponses: boolean("bureauResponses").default(true).notNull(),
  scoreUpdates: boolean("scoreUpdates").default(true).notNull(),
  utilizationAlerts: boolean("utilizationAlerts").default(true).notNull(),
  utilizationThreshold: int("utilizationThreshold").default(30).notNull(), // Alert when utilization exceeds this %
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Notification log for tracking sent notifications
 */
export const notificationLog = mysqlTable("notification_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notificationType: mysqlEnum("notificationType", [
    "payment_reminder",
    "dispute_deadline",
    "bureau_response",
    "score_update",
    "utilization_alert"
  ]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "account", "dispute", "score"
  relatedEntityId: int("relatedEntityId"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
});

export type NotificationLog = typeof notificationLog.$inferSelect;
export type InsertNotificationLog = typeof notificationLog.$inferInsert;
