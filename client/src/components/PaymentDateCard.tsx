import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp, Clock, TrendingDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PaymentRecommendation {
  accountName: string;
  statementDate: Date;
  dueDate: Date;
  optimalPaymentDate: Date;
  optimalPaymentWindow: {
    start: Date;
    end: Date;
  };
  reasoning: string;
  utilizationImpact: {
    current: number;
    afterPayment: number;
    improvement: number;
  };
}

interface PaymentDateCardProps {
  recommendation: PaymentRecommendation;
}

export function PaymentDateCard({ recommendation }: PaymentDateCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const now = new Date();
  const daysUntil = Math.ceil((recommendation.optimalPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine urgency color
  let urgencyColor = "bg-green-500/10 text-green-700 border-green-500/20";
  if (daysUntil <= 3) urgencyColor = "bg-red-500/10 text-red-700 border-red-500/20";
  else if (daysUntil <= 7) urgencyColor = "bg-amber-500/10 text-amber-700 border-amber-500/20";

  return (
    <Card className="elegant-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{recommendation.accountName}</CardTitle>
            <CardDescription className="mt-1">
              Optimal payment: {recommendation.optimalPaymentDate.toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={urgencyColor}>
            <Clock className="w-3 h-3 mr-1" />
            {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilization Impact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Utilization</p>
            <p className="text-2xl font-bold">{recommendation.utilizationImpact.current.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">After Payment</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-green-600">
                {recommendation.utilizationImpact.afterPayment.toFixed(1)}%
              </p>
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Payment Window */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Optimal Payment Window</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {recommendation.optimalPaymentWindow.start.toLocaleDateString()} - {recommendation.optimalPaymentWindow.end.toLocaleDateString()}
          </p>
        </div>

        {/* Expandable Reasoning */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-sm font-medium">Why this date?</span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed">
              {recommendation.reasoning}
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Statement Date:</span>
                <span className="font-medium">{recommendation.statementDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-medium">{recommendation.dueDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Utilization Improvement:</span>
                <span className="font-medium text-green-600">
                  -{recommendation.utilizationImpact.improvement.toFixed(1)}%
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
