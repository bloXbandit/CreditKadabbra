import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Credit Scores
  scores: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCreditScoresByUser(ctx.user.id);
    }),
    latest: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLatestScoresByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        score: z.number().min(300).max(850),
        scoreDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCreditScore({
          userId: ctx.user.id,
          bureau: input.bureau,
          score: input.score,
          scoreDate: input.scoreDate as any,
          notes: input.notes,
        });
      }),
  }),

  // Credit Reports
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCreditReportsByUser(ctx.user.id);
    }),
    upload: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        reportDate: z.string(),
        fileData: z.string(), // base64 encoded file
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Upload file to S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `${ctx.user.id}/reports/${input.bureau}-${Date.now()}-${nanoid(8)}.pdf`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Save report metadata
        return await db.createCreditReport({
          userId: ctx.user.id,
          bureau: input.bureau,
          reportDate: input.reportDate as any,
          fileUrl: url,
          fileKey: fileKey,
          parsed: false,
        });
      }),
  }),

  // Accounts
  accounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAccountsByUser(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccountById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        accountName: z.string(),
        accountNumber: z.string().optional(),
        accountType: z.enum(["revolving", "installment", "mortgage", "other"]),
        status: z.string().optional(),
        balance: z.string().optional(),
        creditLimit: z.string().optional(),
        paymentStatus: z.string().optional(),
        openDate: z.string().optional(),
        lastPaymentDate: z.string().optional(),
        statementDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAccount({
          userId: ctx.user.id,
          bureau: input.bureau,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          accountType: input.accountType,
          status: input.status,
          balance: input.balance,
          creditLimit: input.creditLimit,
          paymentStatus: input.paymentStatus,
          openDate: input.openDate as any,
          lastPaymentDate: input.lastPaymentDate as any,
          statementDate: input.statementDate as any,
          notes: input.notes,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        accountName: z.string().optional(),
        status: z.string().optional(),
        balance: z.string().optional(),
        creditLimit: z.string().optional(),
        paymentStatus: z.string().optional(),
        lastPaymentDate: z.string().optional(),
        statementDate: z.string().optional(),
        isDisputed: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const updates: any = { ...rest };
        if (updates.lastPaymentDate) updates.lastPaymentDate = updates.lastPaymentDate as any;
        if (updates.statementDate) updates.statementDate = updates.statementDate as any;
        return await db.updateAccount(id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteAccount(input.id);
      }),
  }),

  // Inquiries
  inquiries: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInquiriesByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        creditorName: z.string(),
        inquiryDate: z.string(),
        inquiryType: z.enum(["hard", "soft"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createInquiry({
          userId: ctx.user.id,
          bureau: input.bureau,
          creditorName: input.creditorName,
          inquiryDate: input.inquiryDate as any,
          inquiryType: input.inquiryType,
        });
      }),
  }),

  // Public Records
  publicRecords: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPublicRecordsByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        recordType: z.string(),
        filingDate: z.string().optional(),
        status: z.string().optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createPublicRecord({
          userId: ctx.user.id,
          bureau: input.bureau,
          recordType: input.recordType,
          filingDate: input.filingDate as any,
          status: input.status,
          amount: input.amount,
          description: input.description,
        });
      }),
  }),

  // Disputes
  disputes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDisputesByUser(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDisputeById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        itemType: z.enum(["account", "inquiry", "public_record", "personal_info"]),
        itemId: z.number().optional(),
        disputeReason: z.string(),
        letterContent: z.string().optional(),
        status: z.enum(["draft", "sent", "in_progress", "resolved", "rejected"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createDispute({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        disputeReason: z.string().optional(),
        letterContent: z.string().optional(),
        status: z.enum(["draft", "sent", "in_progress", "resolved", "rejected"]).optional(),
        dateSent: z.string().optional(),
        dateResolved: z.string().optional(),
        outcome: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const updates: any = { ...rest };
        if (updates.dateSent) updates.dateSent = updates.dateSent as any;
        if (updates.dateResolved) updates.dateResolved = updates.dateResolved as any;
        return await db.updateDispute(id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDispute(input.id);
      }),
    generateLetter: protectedProcedure
      .input(z.object({
        userInfo: z.object({
          name: z.string(),
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
          ssn: z.string().optional(),
          dateOfBirth: z.string().optional(),
        }),
        bureau: z.enum(["equifax", "experian", "transunion"]),
        items: z.array(z.object({
          type: z.enum(["account", "inquiry", "public_record", "personal_info"]),
          description: z.string(),
          accountNumber: z.string().optional(),
          creditorName: z.string().optional(),
          reason: z.string(),
        })),
        letterType: z.enum(["inaccuracy", "validation", "goodwill", "identity_theft", "mixed_file", "late_payment_removal", "collection_validation", "charge_off_dispute", "inquiry_removal", "bankruptcy_reaging", "account_closure", "credit_limit_increase", "duplicate_account", "outdated_information"]),
      }))
      .mutation(async ({ input }) => {
        const { generateDisputeLetter } = await import('./disputeLetterGenerator');
        const letterContent = generateDisputeLetter(input);
        return { letterContent };
      }),
    generateFromReport: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        userInfo: z.object({
          name: z.string(),
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
          ssn: z.string().optional(),
          dateOfBirth: z.string().optional(),
        }),
        letterType: z.enum(["inaccuracy", "validation", "goodwill", "identity_theft", "mixed_file", "late_payment_removal", "collection_validation", "charge_off_dispute", "inquiry_removal", "bankruptcy_reaging", "account_closure", "credit_limit_increase", "duplicate_account", "outdated_information"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get all reports for user and find the one requested
        const reports = await db.getCreditReportsByUser(ctx.user.id);
        const report = reports.find((r: any) => r.id === input.reportId);
        if (!report) {
          throw new Error('Report not found');
        }
        
        // Get all accounts for user and filter by reportId
        const allAccounts = await db.getAccountsByUser(ctx.user.id);
        const reportAccounts = allAccounts.filter((acc: any) => acc.reportId === input.reportId);
        const negativeAccounts = reportAccounts.filter((acc: any) => acc.isNegative);
        
        const { generateDisputeLetterFromReport } = await import('./disputeLetterGenerator');
        const letterContent = generateDisputeLetterFromReport(
          input.userInfo,
          report.bureau,
          negativeAccounts.map((acc: any) => ({
            accountName: acc.accountName,
            accountNumber: acc.accountNumber || undefined,
            paymentStatus: acc.paymentStatus || undefined,
            isNegative: acc.isNegative,
          })),
          input.letterType || 'inaccuracy'
        );
        
        return { letterContent, negativeItemsCount: negativeAccounts.length };
      }),
  }),

  // Documents
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDocumentsByUser(ctx.user.id);
    }),
    byCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getDocumentsByCategory(ctx.user.id, input.category);
      }),
    upload: protectedProcedure
      .input(z.object({
        category: z.enum(["credit_report", "dispute_letter", "bureau_response", "supporting_doc", "other"]),
        filename: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        relatedDisputeId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `${ctx.user.id}/documents/${input.category}-${Date.now()}-${nanoid(8)}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        return await db.createDocument({
          userId: ctx.user.id,
          category: input.category,
          filename: input.filename,
          fileUrl: url,
          fileKey: fileKey,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          relatedDisputeId: input.relatedDisputeId,
          notes: input.notes,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDocument(input.id);
      }),
  }),

  // Tasks
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTasksByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        relatedDisputeId: z.number().optional(),
        relatedAccountId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate as any,
          priority: input.priority,
          relatedDisputeId: input.relatedDisputeId,
          relatedAccountId: input.relatedAccountId,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        completed: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const updates: any = { ...rest };
        if (updates.dueDate) updates.dueDate = updates.dueDate as any;
        return await db.updateTask(id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteTask(input.id);
      }),
  }),

  // Privacy Actions
  privacy: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPrivacyActionsByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        bureau: z.enum(["equifax", "experian", "transunion"]),
        actionType: z.enum(["opt_out_prescreened", "opt_out_sharing", "limit_sensitive", "freeze", "other"]),
        actionDate: z.string(),
        confirmationNumber: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createPrivacyAction({
          userId: ctx.user.id,
          bureau: input.bureau,
          actionType: input.actionType,
          actionDate: input.actionDate as any,
          confirmationNumber: input.confirmationNumber,
          notes: input.notes,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "failed"]),
        confirmationNumber: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updatePrivacyAction(id, updates);
      }),
  }),

  // Wayfinder Scenarios
  wayfinder: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWayfinderScenariosByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        scenarioName: z.string(),
        scenarioType: z.enum(["balance_paydown", "collection_removal", "missed_payment_correction", "inquiry_removal", "custom"]),
        currentScore: z.number().optional(),
        parameters: z.string(), // JSON string
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createWayfinderScenario({
          userId: ctx.user.id,
          ...input,
        });
      }),
    simulate: protectedProcedure
      .input(z.object({
        scenarioType: z.enum(["balance_paydown", "collection_removal", "missed_payment_correction", "inquiry_removal"]),
        currentScore: z.number(),
        parameters: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        // Simplified score impact calculation
        let projectedChange = 0;
        
        switch (input.scenarioType) {
          case "balance_paydown":
            // Estimate: reducing utilization can improve score by 10-50 points
            const utilizationReduction = Number(input.parameters.utilizationReduction) || 0;
            projectedChange = Math.round(utilizationReduction * 0.5);
            break;
          case "collection_removal":
            // Estimate: removing collections can improve score by 20-100 points
            const collectionsCount = Number(input.parameters.collectionsCount) || 1;
            projectedChange = Math.min(100, collectionsCount * 35);
            break;
          case "missed_payment_correction":
            // Estimate: correcting missed payments can improve score by 30-80 points
            const missedPaymentsCount = Number(input.parameters.missedPaymentsCount) || 1;
            projectedChange = Math.min(80, missedPaymentsCount * 40);
            break;
          case "inquiry_removal":
            // Estimate: removing inquiries can improve score by 5-15 points
            const inquiriesCount = Number(input.parameters.inquiriesCount) || 1;
            projectedChange = Math.min(15, inquiriesCount * 5);
            break;
        }
        
        return {
          currentScore: input.currentScore,
          projectedScore: Math.min(850, input.currentScore + projectedChange),
          projectedChange,
        };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteWayfinderScenario(input.id);
      }),
  }),

  // Milestones
  milestones: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMilestonesByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        milestoneType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        achievedDate: z.string(),
        value: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createMilestone({
          userId: ctx.user.id,
          milestoneType: input.milestoneType,
          title: input.title,
          description: input.description,
          achievedDate: input.achievedDate as any,
          value: input.value,
        });
      }),
  }),

  // Score Goals
  goals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getScoreGoalsByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        targetScore: z.number().min(300).max(850),
        targetDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createScoreGoal({
          userId: ctx.user.id,
          targetScore: input.targetScore,
          targetDate: input.targetDate as any,
          notes: input.notes,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        achieved: z.boolean().optional(),
        achievedDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const updates: any = { ...rest };
        if (updates.achievedDate) updates.achievedDate = updates.achievedDate as any;
        return await db.updateScoreGoal(id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteScoreGoal(input.id);
      }),
  }),
  // Alternative Bureaus
  alternativeBureaus: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllAlternativeBureaus();
    }),
    reports: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAlternativeReports(ctx.user.id);
    }),
    requestReport: protectedProcedure
      .input(z.object({
        bureauId: z.number(),
        requestDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createUserAlternativeReport({
          userId: ctx.user.id,
          bureauId: input.bureauId,
          requestDate: input.requestDate as any,
          status: "requested",
          notes: input.notes,
        });
      }),
    updateReport: protectedProcedure
      .input(z.object({
        id: z.number(),
        receivedDate: z.string().optional(),
        status: z.enum(["requested", "received", "reviewed"]).optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const updateData: any = {};
        if (updates.receivedDate) updateData.receivedDate = updates.receivedDate;
        if (updates.status) updateData.status = updates.status;
        if (updates.fileUrl) updateData.fileUrl = updates.fileUrl;
        if (updates.fileKey) updateData.fileKey = updates.fileKey;
        if (updates.notes) updateData.notes = updates.notes;
        await db.updateUserAlternativeReport(id, updateData);
        return { success: true };
      }),
    disputes: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAlternativeBureauDisputes(ctx.user.id);
    }),
    createDispute: protectedProcedure
      .input(z.object({
        bureauId: z.number(),
        disputeDate: z.string(),
        description: z.string(),
        letterContent: z.string().optional(),
        status: z.enum(["draft", "submitted", "investigating", "resolved", "rejected"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAlternativeBureauDispute({
          userId: ctx.user.id,
          bureauId: input.bureauId,
          disputeDate: input.disputeDate as any,
          description: input.description,
          letterContent: input.letterContent,
          status: input.status || "draft",
        });
      }),
    updateDispute: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "submitted", "investigating", "resolved", "rejected"]).optional(),
        resolutionDate: z.string().optional(),
        outcome: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const updateData: any = {};
        if (updates.status) updateData.status = updates.status;
        if (updates.resolutionDate) updateData.resolutionDate = updates.resolutionDate;
        if (updates.outcome) updateData.outcome = updates.outcome;
        if (updates.notes) updateData.notes = updates.notes;
        await db.updateAlternativeBureauDispute(id, updateData);
        return { success: true };
      }),
  }),

  // Opt-Out Tracker
  optOuts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserOptOuts(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        bureauId: z.number().optional(),
        bureauType: z.enum(["major", "alternative"]),
        optOutDate: z.string(),
        status: z.enum(["pending", "confirmed", "expired"]).optional(),
        confirmationNumber: z.string().optional(),
        expirationDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createOptOut({
          userId: ctx.user.id,
          bureauId: input.bureauId,
          bureauType: input.bureauType,
          optOutDate: input.optOutDate as any,
          status: input.status || "pending",
          confirmationNumber: input.confirmationNumber,
          expirationDate: input.expirationDate as any,
          notes: input.notes,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "expired"]).optional(),
        confirmationNumber: z.string().optional(),
        expirationDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const updateData: any = {};
        if (updates.status) updateData.status = updates.status;
        if (updates.confirmationNumber) updateData.confirmationNumber = updates.confirmationNumber;
        if (updates.expirationDate) updateData.expirationDate = updates.expirationDate;
        if (updates.notes) updateData.notes = updates.notes;
        await db.updateOptOut(id, updateData);
        return { success: true };
      }),
  }),

  // Security Freeze Tracker
  freezes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSecurityFreezes(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        bureauId: z.number().optional(),
        bureauType: z.enum(["major", "alternative"]),
        freezeDate: z.string(),
        status: z.enum(["active", "lifted_temp", "lifted_perm", "removed"]).optional(),
        pinEncrypted: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createSecurityFreeze({
          userId: ctx.user.id,
          bureauId: input.bureauId,
          bureauType: input.bureauType,
          freezeDate: input.freezeDate as any,
          status: input.status || "active",
          pinEncrypted: input.pinEncrypted,
          notes: input.notes,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "lifted_temp", "lifted_perm", "removed"]).optional(),
        liftExpiration: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const updateData: any = {};
        if (updates.status) updateData.status = updates.status;
        if (updates.liftExpiration) updateData.liftExpiration = new Date(updates.liftExpiration);
        if (updates.notes) updateData.notes = updates.notes;
        await db.updateSecurityFreeze(id, updateData);
        return { success: true };
      }),
  }),

  // Live Accounts (User-Managed)
  liveAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserLiveAccounts(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        accountName: z.string(),
        accountType: z.enum(["credit_card", "auto_loan", "personal_loan", "student_loan", "mortgage", "other"]),
        issuer: z.string().optional(),
        currentBalance: z.number().optional(),
        creditLimit: z.number().optional(),
        originalAmount: z.number().optional(),
        monthlyPayment: z.number().optional(),
        minimumPayment: z.number().optional(),
        statementDate: z.number().min(1).max(31).optional(),
        paymentDueDate: z.number().min(1).max(31).optional(),
        interestRate: z.number().optional(),
        remainingTerm: z.number().optional(),
        status: z.enum(["current", "late", "closed", "paid_off"]).optional(),
        propertyAddress: z.string().optional(),
        estimatedValue: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createLiveAccount({
          userId: ctx.user.id,
          ...input,
          status: input.status || "current",
        } as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        accountName: z.string().optional(),
        currentBalance: z.number().optional(),
        creditLimit: z.number().optional(),
        monthlyPayment: z.number().optional(),
        minimumPayment: z.number().optional(),
        statementDate: z.number().min(1).max(31).optional(),
        paymentDueDate: z.number().min(1).max(31).optional(),
        interestRate: z.number().optional(),
        remainingTerm: z.number().optional(),
        status: z.enum(["current", "late", "closed", "paid_off"]).optional(),
        estimatedValue: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateLiveAccount(id, updates as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLiveAccount(input.id);
        return { success: true };
      }),
    importCSV: protectedProcedure
      .input(z.object({
        csvContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { parseAccountsCSV } = await import('./csvParser');
        
        try {
          const accounts = parseAccountsCSV(input.csvContent);
          
          // Import each account
          const imported = [];
          for (const acc of accounts) {
            const created = await db.createLiveAccount({
              userId: ctx.user.id,
              accountName: acc.accountName,
              accountType: acc.accountType as any || 'other',
              currentBalance: acc.balance ? parseFloat(acc.balance) : undefined,
              creditLimit: acc.creditLimit ? parseFloat(acc.creditLimit) : undefined,
              monthlyPayment: acc.monthlyPayment ? parseFloat(acc.monthlyPayment) : undefined,
              interestRate: acc.interestRate ? parseFloat(acc.interestRate) : undefined,
              status: 'current',
            } as any);
            imported.push(created);
          }
          
          return {
            success: true,
            imported: imported.length,
            accounts: imported,
          };
        } catch (error: any) {
          throw new Error(`CSV import failed: ${error.message}`);
        }
      }),
  }),

  // Legal Citations
  legalCitations: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllLegalCitations();
    }),
    byCategory: protectedProcedure
      .input(z.object({ errorCategory: z.string() }))
      .query(async ({ input }) => {
        return await db.getLegalCitationsByCategory(input.errorCategory);
      }),
  }),

  // Credit Report Errors
  reportErrors: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCreditReportErrors(ctx.user.id);
    }),
    unresolved: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnresolvedErrors(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        reportId: z.number().optional(),
        errorType: z.enum([
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
        ]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        itemType: z.enum(["account", "inquiry", "public_record", "personal_info"]),
        itemId: z.number().optional(),
        errorDescription: z.string(),
        suggestedAction: z.string().optional(),
        legalCitationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCreditReportError({
          userId: ctx.user.id,
          ...input,
          resolved: false,
        } as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        resolved: z.boolean().optional(),
        resolvedDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const updateData: any = {};
        if (updates.resolved !== undefined) updateData.resolved = updates.resolved;
        if (updates.resolvedDate) updateData.resolvedDate = updates.resolvedDate;
        await db.updateCreditReportError(id, updateData);
        return { success: true };
      }),
  }),

  // Dispute Letter Templates
  letterTemplates: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllDisputeLetterTemplates();
    }),
    byErrorType: protectedProcedure
      .input(z.object({ errorType: z.string() }))
      .query(async ({ input }) => {
        return await db.getDisputeLetterTemplateByErrorType(input.errorType);
      }),
    generate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        variables: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ input }) => {
        const templates = await db.getAllDisputeLetterTemplates();
        const template = templates.find(t => t.id === input.templateId);
        if (!template) {
          throw new Error("Template not found");
        }
        
        // Simple variable replacement
        let letter = template.templateContent;
        for (const [key, value] of Object.entries(input.variables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          letter = letter.replace(regex, value);
        }
        
        return { letter, template };
      }),
  }),

  // Live Score Calculator
  scoreCalculator: router({
    calculate: protectedProcedure
      .input(z.object({
        accounts: z.array(z.any()),
        inquiries: z.array(z.any()).optional(),
        publicRecords: z.array(z.any()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { calculateCreditScore } = await import('./scoreCalculator');
        const { convertLiveAccountToAccountData } = await import('./reportParser');
        
        const accountData = input.accounts.map(convertLiveAccountToAccountData);
        
        const result = calculateCreditScore({
          accounts: accountData,
          inquiries: input.inquiries || [],
          publicRecords: input.publicRecords || [],
        });
        
        return result;
      }),
    
    calculateFromLiveAccounts: protectedProcedure
      .query(async ({ ctx }) => {
        const { calculateCreditScore } = await import('./scoreCalculator');
        const { convertLiveAccountToAccountData } = await import('./reportParser');
        
        const liveAccounts = await db.getUserLiveAccounts(ctx.user.id);
        const inquiries: any[] = [];
        const publicRecords: any[] = [];
        
        const accountData = liveAccounts.map(convertLiveAccountToAccountData);
        
        const result = calculateCreditScore({
          accounts: accountData,
          inquiries: inquiries || [],
          publicRecords: publicRecords || [],
        });
        
        // Store calculated score for each bureau
        const bureaus: Array<'equifax' | 'experian' | 'transunion'> = ['equifax', 'experian', 'transunion'];
        for (const bureau of bureaus) {
          await db.createCreditScore({
            userId: ctx.user.id,
            bureau,
            score: result.score,
            scoreDate: new Date().toISOString() as any,
            notes: `Calculated score based on ${accountData.length} accounts`,
          });
        }
        
        return result;
      }),
    
    simulateImpact: protectedProcedure
      .input(z.object({
        accountChanges: z.array(z.any()).optional(),
        inquiryChanges: z.array(z.any()).optional(),
        publicRecordChanges: z.array(z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { calculateScoreImpact } = await import('./scoreCalculator');
        const { convertLiveAccountToAccountData } = await import('./reportParser');
        
        const liveAccounts = await db.getUserLiveAccounts(ctx.user.id);
        const inquiries: any[] = [];
        const publicRecords: any[] = [];
        
        const currentProfile = {
          accounts: liveAccounts.map(convertLiveAccountToAccountData),
          inquiries: inquiries || [],
          publicRecords: publicRecords || [],
        };
        
        const newProfile = {
          accounts: input.accountChanges ? input.accountChanges.map(convertLiveAccountToAccountData) : currentProfile.accounts,
          inquiries: input.inquiryChanges || currentProfile.inquiries,
          publicRecords: input.publicRecordChanges || currentProfile.publicRecords,
        };
        
        return calculateScoreImpact(currentProfile, newProfile);
      }),
  }),

  // Bureau Simulator & Payment Calculator
  reportUpload: router({
    uploadPDF: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded PDF
        fileName: z.string(),
        bureau: z.enum(['equifax', 'experian', 'transunion']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { parseTransUnionReportV2 } = await import('./transunionParserV2');
        const { calculateCreditScore } = await import('./scoreCalculator');
        const { simulateMissingBureauScores } = await import('./bureauSimulator');
        
        // Decode base64 and save temporarily
        const buffer = Buffer.from(input.fileData, 'base64');
        const tempPath = `/tmp/${nanoid()}.pdf`;
        const fs = require('fs');
        fs.writeFileSync(tempPath, buffer);
        
        try {
          // Parse the PDF
          const parsed = await parseTransUnionReportV2(tempPath);
          
          // Calculate score from parsed data
          const scoreResult = calculateCreditScore({
            accounts: parsed.accounts.map((acc: any) => ({
              accountType: acc.accountType || 'revolving',
              currentBalance: parseFloat(acc.balance?.toString() || '0') || 0,
              creditLimit: parseFloat(acc.creditLimit?.toString() || '0') || undefined,
              status: acc.paymentStatus || 'current',
              openDate: acc.dateOpened || new Date().toISOString(),
            })),
            inquiries: (parsed.inquiries || []).map((inq: any) => ({
              date: inq.inquiryDate || new Date().toISOString(),
              creditor: inq.creditorName || 'Unknown',
              type: inq.inquiryType || 'hard',
            })),
            publicRecords: [],
          });
          
          const bureau = input.bureau || 'transunion';
          const actualScore = scoreResult.score;
          
          // Simulate missing bureau scores
          const allBureauScores = simulateMissingBureauScores(
            bureau,
            actualScore,
            parsed.accounts.length
          );
          
          // Store all scores
          for (const bureauScore of allBureauScores) {
            await db.createCreditScore({
              userId: ctx.user.id,
              bureau: bureauScore.bureau,
              score: bureauScore.score,
              scoreDate: new Date().toISOString() as any,
              notes: bureauScore.isSimulated 
                ? `Simulated (${bureauScore.confidence} confidence): ${bureauScore.notes}`
                : bureauScore.notes || 'From uploaded TransUnion PDF report',
            });
          }
          
          // Store parsed accounts as live accounts
          let accountsCreated = 0;
          for (const account of parsed.accounts) {
            await db.createLiveAccount({
              userId: ctx.user.id,
              accountName: account.accountName || `Account ${accountsCreated + 1}`,
              accountType: account.accountType as any,
              currentBalance: account.balance?.toString() || '0',
              creditLimit: account.creditLimit?.toString(),
              status: (account.paymentStatus?.toLowerCase().includes('current') ? 'current' : 
                      account.paymentStatus?.toLowerCase().includes('late') ? 'late' :
                      account.paymentStatus?.toLowerCase().includes('closed') ? 'closed' :
                      account.paymentStatus?.toLowerCase().includes('paid') ? 'paid_off' : undefined) as any,
            });
            accountsCreated++;
          }
          
          // Clean up temp file
          fs.unlinkSync(tempPath);
          
          return {
            parsed,
            scoreResult,
            bureauScores: allBureauScores,
            accountsCreated,
            negativeItemsFound: parsed.accounts.filter((a: any) => a.isNegative).length,
          };
        } catch (error: any) {
          // Clean up temp file on error
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          throw new Error(`PDF parsing failed: ${error.message}`);
        }
      }),
    parseAndGenerateScore: protectedProcedure
      .input(z.object({
        reportText: z.string(),
        bureau: z.enum(['equifax', 'experian', 'transunion']).optional(),
        reportedScore: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { parseCreditReportText } = await import('./reportParser');
        const { calculateCreditScore } = await import('./scoreCalculator');
        const { simulateMissingBureauScores } = await import('./bureauSimulator');
        
        // Parse the credit report
        const parsed = parseCreditReportText(input.reportText);
        
        // Calculate score from parsed data
        const scoreResult = calculateCreditScore({
          accounts: parsed.accounts,
          inquiries: parsed.inquiries,
          publicRecords: parsed.publicRecords,
        });
        
        // Determine which score to use
        const actualScore = input.reportedScore || scoreResult.score;
        const bureau = input.bureau || 'experian'; // Default to Experian if not specified
        
        // Simulate missing bureau scores
        const allBureauScores = simulateMissingBureauScores(
          bureau,
          actualScore,
          parsed.accounts.length
        );
        
        // Store all scores
        for (const bureauScore of allBureauScores) {
          await db.createCreditScore({
            userId: ctx.user.id,
            bureau: bureauScore.bureau,
            score: bureauScore.score,
            scoreDate: new Date().toISOString() as any,
            notes: bureauScore.isSimulated 
              ? `Simulated (${bureauScore.confidence} confidence): ${bureauScore.notes}`
              : bureauScore.notes || 'From uploaded credit report',
          });
        }
        
        // Store parsed accounts as live accounts
        for (const account of parsed.accounts) {
          await db.createLiveAccount({
            userId: ctx.user.id,
            accountName: `Account ${parsed.accounts.indexOf(account) + 1}`,
            accountType: account.accountType,
            currentBalance: account.currentBalance.toString(),
            creditLimit: account.creditLimit?.toString(),
            status: account.status,
          });
        }
        
        return {
          parsed,
          scoreResult,
          bureauScores: allBureauScores,
          accountsCreated: parsed.accounts.length,
        };
      }),
  }),

  paymentOptimizer: router({
    calculateOptimalDate: protectedProcedure
      .input(z.object({
        accountName: z.string(),
        statementDate: z.string(),
        dueDate: z.string(),
        currentBalance: z.number(),
        creditLimit: z.number(),
        plannedPayment: z.number().optional(),
      }))
      .query(({ input }) => {
        const { calculateOptimalPaymentDate } = require('./bureauSimulator');
        
        return calculateOptimalPaymentDate(
          input.accountName,
          new Date(input.statementDate),
          new Date(input.dueDate),
          input.currentBalance,
          input.creditLimit,
          input.plannedPayment
        );
      }),
    
    calculateAllDates: protectedProcedure
      .query(async ({ ctx }) => {
        const { calculateAllPaymentDates, estimateStatementDate } = await import('./bureauSimulator');
        
        const liveAccounts = await db.getUserLiveAccounts(ctx.user.id);
        
        // Filter to revolving accounts with due dates
        const accountsWithDates = liveAccounts
          .filter(a => a.accountType === 'credit_card' && a.creditLimit && Number(a.creditLimit) > 0)
          .map(a => {
            const now = new Date();
            const statementDay = a.statementDate || 1;
            const dueDay = a.paymentDueDate || 21;
            
            const statementDate = new Date(now.getFullYear(), now.getMonth(), statementDay);
            const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
            
            return {
              name: a.accountName,
              statementDate,
              dueDate,
              currentBalance: Number(a.currentBalance) || 0,
              creditLimit: Number(a.creditLimit) || 0,
            };
          });
        
        return calculateAllPaymentDates(accountsWithDates);
         }),
  }),

  // AI Assistant
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
        context: z.object({
          page: z.string(),
          userScores: z.object({
            equifax: z.number().optional(),
            experian: z.number().optional(),
            transunion: z.number().optional(),
          }).optional(),
          accounts: z.array(z.any()).optional(),
          disputes: z.array(z.any()).optional(),
          errors: z.array(z.any()).optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { chatWithCreditGuru } = await import("./aiAssistant");
        
        const response = await chatWithCreditGuru(
          input.messages.map(m => ({ role: m.role, content: m.content })),
          input.context
        );
        
        // Save user message and AI response to history
        const lastUserMessage = input.messages[input.messages.length - 1];
        if (lastUserMessage) {
          await db.saveChatMessage({
            userId: ctx.user.id,
            role: lastUserMessage.role,
            content: lastUserMessage.content,
            context: JSON.stringify(input.context),
          });
        }
        
        await db.saveChatMessage({
          userId: ctx.user.id,
          role: "assistant",
          content: response,
          context: JSON.stringify(input.context),
        });
        
        return { message: response };
      }),
    
    history: protectedProcedure.query(async ({ ctx }) => {
      const messages = await db.getUserChatHistory(ctx.user.id, 50);
      return messages.reverse(); // Return in chronological order
    }),
    
    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearUserChatHistory(ctx.user.id);
      return { success: true };
    }),
  }),

  // Notification Preferences
  notifications: router({
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const prefs = await db.getNotificationPreferences(ctx.user.id);
      if (!prefs) {
        // Create default preferences
        return await db.createNotificationPreferences({
          userId: ctx.user.id,
          paymentReminders: true,
          paymentReminderDays: 3,
          disputeDeadlines: true,
          bureauResponses: true,
          scoreUpdates: true,
          utilizationAlerts: true,
          utilizationThreshold: 30
        });
      }
      return prefs;
    }),
    
    updatePreferences: protectedProcedure
      .input(z.object({
        paymentReminders: z.boolean().optional(),
        paymentReminderDays: z.number().min(1).max(7).optional(),
        disputeDeadlines: z.boolean().optional(),
        bureauResponses: z.boolean().optional(),
        scoreUpdates: z.boolean().optional(),
        utilizationAlerts: z.boolean().optional(),
        utilizationThreshold: z.number().min(10).max(90).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),
    
    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50)
      }))
      .query(async ({ ctx, input }) => {
        return await db.getNotificationLogByUser(ctx.user.id, input.limit);
      }),
  }),
});
export type AppRouter = typeof appRouter;
