import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, AlertCircle } from "lucide-react";
import { PaymentDateCard } from "@/components/PaymentDateCard";

export default function PaymentCalendar() {
  const { data: recommendations, isLoading, error } = trpc.paymentOptimizer.calculateAllDates.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>Failed to load payment recommendations: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          Payment Calendar
        </h1>
        <p className="text-muted-foreground">
          Optimal payment dates to minimize reported credit utilization
        </p>
      </div>

      {!recommendations || recommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Credit Cards Found</h3>
              <p className="text-muted-foreground">
                Add credit card accounts with statement and due dates to see payment recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{recommendations.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {recommendations.filter(r => {
                    const daysUntil = Math.ceil((new Date(r.optimalPaymentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntil >= 0 && daysUntil <= 7;
                  }).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Utilization Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  -{(recommendations.reduce((sum, r) => sum + r.utilizationImpact.improvement, 0) / recommendations.length).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Recommendations */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recommended Payment Dates</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec, idx) => (
                <PaymentDateCard
                  key={idx}
                  recommendation={{
                    ...rec,
                    statementDate: new Date(rec.statementDate),
                    dueDate: new Date(rec.dueDate),
                    optimalPaymentDate: new Date(rec.optimalPaymentDate),
                    optimalPaymentWindow: {
                      start: new Date(rec.optimalPaymentWindow.start),
                      end: new Date(rec.optimalPaymentWindow.end),
                    },
                  }}
                />
              ))}
            </div>
          </div>

          {/* Educational Content */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>How Payment Timing Affects Your Credit Score</CardTitle>
              <CardDescription>
                Understanding the relationship between statement dates and credit reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Why Pay Before the Statement Date?</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most credit card issuers report your balance to the credit bureaus 1-3 days after your statement closing date. 
                  By paying down your balance before the statement closes, you ensure a lower balance gets reported, which improves 
                  your credit utilization ratio—one of the most important factors in your credit score (30% of FICO score).
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">The 4-Day Rule</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We recommend paying 4 days before your statement date to allow time for payment processing. This ensures your 
                  payment posts before the statement closes, maximizing the impact on your reported utilization.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Optimal Utilization</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keep your reported utilization below 30% for good credit, and below 10% for excellent credit. Even if you pay 
                  your balance in full every month, the timing of your payment relative to the statement date determines what 
                  utilization gets reported to the bureaus.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
