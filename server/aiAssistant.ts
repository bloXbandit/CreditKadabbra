import { invokeLLM } from "./_core/llm";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PageContext {
  page: string;
  userScores?: { equifax?: number; experian?: number; transunion?: number };
  accounts?: Array<{
    name: string;
    type: string;
    balance: number;
    limit?: number;
    utilization?: number;
  }>;
  disputes?: Array<{
    title: string;
    status: string;
    bureaus: string[];
  }>;
  errors?: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
}

const CREDIT_GURU_SYSTEM_PROMPT = `You are an expert credit repair specialist and FCRA compliance guru with 20+ years of experience helping people clean up their credit reports and maximize their scores. Your role is to provide actionable, legally-backed advice to help users dispute errors, optimize their credit, and understand the credit system.

**Your Expertise:**
- Deep knowledge of FCRA (Fair Credit Reporting Act), FDCPA, and state consumer protection laws
- Metro 2 format compliance and common reporting errors
- FICO and VantageScore calculation methodologies
- Dispute letter writing and bureau communication strategies
- Credit utilization optimization and payment timing
- Tradeline analysis and account management

**Your Communication Style:**
- Direct, confident, and empowering
- Use plain English to explain complex credit concepts
- Provide specific, actionable steps (not vague advice)
- Reference specific laws and regulations when relevant
- Be encouraging but realistic about timelines and outcomes
- Use examples and analogies to clarify difficult concepts

**Your Capabilities:**
- Analyze credit reports and identify errors
- Suggest dispute priorities based on score impact
- Write custom dispute letters with legal citations
- Explain credit score factors and optimization strategies
- Recommend payment dates to minimize utilization reporting
- Guide users through Wayfinder scenarios
- Answer questions about alternative credit bureaus
- Provide step-by-step action plans

**Important Guidelines:**
- Always cite specific FCRA sections when discussing legal rights (e.g., "Under 15 USC § 1681i, bureaus must investigate within 30 days")
- Prioritize high-impact actions (removing collections > fixing utilization > removing inquiries)
- Warn users about common mistakes (disputing too many items at once, using generic letters)
- Encourage documentation and certified mail for all disputes
- Never guarantee specific score increases, but provide realistic estimates
- Remind users that legitimate negative items can't be removed just because they're inconvenient

When analyzing credit data, focus on:
1. Payment history issues (35% of score)
2. High utilization (30% of score)
3. Errors and inaccuracies that violate FCRA
4. Metro 2 compliance violations
5. Statute of limitations violations

Be the credit guru users wish they had on speed dial.`;

export function getContextualSystemPrompt(context: PageContext): string {
  let contextPrompt = CREDIT_GURU_SYSTEM_PROMPT;

  // Add page-specific context
  switch (context.page) {
    case "dashboard":
      contextPrompt += `\n\n**Current Context:** User is on the dashboard. They can see their tri-merge scores: ${context.userScores?.equifax || "N/A"} (Equifax), ${context.userScores?.experian || "N/A"} (Experian), ${context.userScores?.transunion || "N/A"} (TransUnion). Focus on overall credit health, score trends, and high-priority actions.`;
      break;

    case "scores":
      contextPrompt += `\n\n**Current Context:** User is viewing their credit scores page. Scores: ${context.userScores?.equifax || "N/A"} (Equifax), ${context.userScores?.experian || "N/A"} (Experian), ${context.userScores?.transunion || "N/A"} (TransUnion). Focus on score factors, what's impacting their scores, and how to improve them.`;
      break;

    case "accounts":
      if (context.accounts && context.accounts.length > 0) {
        const accountSummary = context.accounts
          .map((a) => `${a.name} (${a.type}): $${a.balance}${a.limit ? ` / $${a.limit} (${a.utilization?.toFixed(1)}% util)` : ""}`)
          .join(", ");
        contextPrompt += `\n\n**Current Context:** User is viewing their accounts. Active accounts: ${accountSummary}. Focus on utilization optimization, payment timing, and account management strategies.`;
      } else {
        contextPrompt += `\n\n**Current Context:** User is on the accounts page but hasn't added any accounts yet. Encourage them to add accounts or upload a credit report to get personalized advice.`;
      }
      break;

    case "disputes":
      if (context.disputes && context.disputes.length > 0) {
        const disputeSummary = context.disputes
          .map((d) => `"${d.title}" (${d.status}) - ${d.bureaus.join(", ")}`)
          .join("; ");
        contextPrompt += `\n\n**Current Context:** User is managing disputes. Active disputes: ${disputeSummary}. Focus on dispute strategy, letter writing, follow-up timing, and escalation tactics.`;
      } else {
        contextPrompt += `\n\n**Current Context:** User is on the disputes page but hasn't filed any disputes yet. Help them identify what to dispute and how to get started.`;
      }
      break;

    case "wayfinder":
      contextPrompt += `\n\n**Current Context:** User is using the Wayfinder score simulator. Help them understand score impact scenarios, prioritize actions, and create a strategic plan for score improvement.`;
      break;

    case "report-upload":
      contextPrompt += `\n\n**Current Context:** User is uploading a credit report. Guide them on what to look for, how to identify errors, and what to do after parsing the report.`;
      break;

    case "payment-calendar":
      contextPrompt += `\n\n**Current Context:** User is viewing the payment calendar. Focus on optimal payment timing, the 4-day rule, and utilization management strategies.`;
      break;

    case "alternative-bureaus":
      contextPrompt += `\n\n**Current Context:** User is managing alternative credit bureaus (Innovis, LexisNexis, SageStream, ChexSystems, CoreLogic, Clarity). Explain how these bureaus work, why they matter, and how to dispute errors or opt out.`;
      break;

    case "privacy":
      contextPrompt += `\n\n**Current Context:** User is managing privacy and opt-out actions. Focus on data sharing controls, marketing opt-outs, and protecting personal information.`;
      break;

    case "live-accounts":
      contextPrompt += `\n\n**Current Context:** User is tracking live accounts with real-time utilization. Focus on balance management, payment strategies, and score optimization.`;
      break;

    default:
      contextPrompt += `\n\n**Current Context:** User is navigating the credit repair app. Provide general credit repair guidance and answer any questions they have.`;
  }

  // Add detected errors if available
  if (context.errors && context.errors.length > 0) {
    const errorSummary = context.errors
      .map((e) => `${e.type} (${e.severity}): ${e.description}`)
      .join("; ");
    contextPrompt += `\n\n**Detected Errors:** ${errorSummary}. Prioritize helping the user understand and dispute these errors.`;
  }

  return contextPrompt;
}

export async function chatWithCreditGuru(
  messages: ChatMessage[],
  context: PageContext
): Promise<string> {
  const systemPrompt = getContextualSystemPrompt(context);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }
  return "I apologize, but I'm having trouble responding right now. Please try again.";
}
