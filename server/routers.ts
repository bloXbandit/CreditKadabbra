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
        bureau: z.enum(["equifax", "experian", "transunion"]),
        itemType: z.enum(["account", "inquiry", "public_record", "personal_info"]),
        disputeReason: z.string(),
        accountName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Generate dispute letter template
        const bureauAddresses: Record<string, string> = {
          equifax: "Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374",
          experian: "Experian\nP.O. Box 4500\nAllen, TX 75013",
          transunion: "TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016",
        };

        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        let letter = `${today}\n\n${bureauAddresses[input.bureau]}\n\nRe: Request for Investigation of Inaccurate Information\n\nDear Sir or Madam,\n\n`;
        letter += `I am writing to dispute the following information in my credit file. The items I dispute are inaccurate and incomplete.\n\n`;
        
        if (input.accountName) {
          letter += `Account: ${input.accountName}\n`;
        }
        letter += `Reason for dispute: ${input.disputeReason}\n\n`;
        
        letter += `I am requesting that the item be removed or corrected to reflect the accurate information. Enclosed are copies of supporting documents.\n\n`;
        letter += `Please investigate this matter and delete or correct the disputed item as soon as possible.\n\n`;
        letter += `Sincerely,\n\n${ctx.user.name || '[Your Name]'}\n`;
        
        return { letterContent: letter };
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
});

export type AppRouter = typeof appRouter;
