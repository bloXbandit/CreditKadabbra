import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Shield, Download, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ALTERNATIVE_BUREAUS = [
  {
    id: "innovis",
    name: "Innovis",
    description: "The 4th major credit bureau with full credit history",
    website: "https://www.innovis.com",
    reportUrl: "https://www.innovis.com/personal/requestReport",
    disputeUrl: "https://www.innovis.com/personal/lc_dispute",
    freezeUrl: "https://www.innovis.com/personal/securityFreeze",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  {
    id: "lexisnexis",
    name: "LexisNexis",
    description: "Insurance risk scoring, background checks, claims history",
    website: "https://consumer.risk.lexisnexis.com",
    reportUrl: "https://consumer.risk.lexisnexis.com/request",
    disputeUrl: "https://consumer.risk.lexisnexis.com/dispute",
    freezeUrl: "https://consumer.risk.lexisnexis.com/freeze",
    color: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  },
  {
    id: "sagestream",
    name: "SageStream",
    description: "Alternative credit (payday loans, rent-to-own, subprime)",
    website: "https://www.sagestreamllc.com",
    reportUrl: "https://www.sagestreamllc.com/request-your-report/",
    disputeUrl: "https://www.sagestreamllc.com/file-dispute/",
    freezeUrl: "https://www.sagestreamllc.com/security-freeze/",
    color: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  {
    id: "chexsystems",
    name: "ChexSystems",
    description: "Banking history (bounced checks, overdrafts, account closures)",
    website: "https://www.chexsystems.com",
    reportUrl: "https://www.chexsystems.com/web/chexsystems/consumerdebit/page/requestreports/consumerdisclosure/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8zi_QJNXQ28_A38Q4wCHT0NzQwCvYP8TAx9jcz0w1EVGAQHmAIVBPga-xgEGfgYhDr6uQV5Gxt4m3j4Bvv7GJsYGxj4m-sH6kfCjCDI8DMyPy8xNxUAVlJHxg!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/",
    disputeUrl: "https://www.chexsystems.com/web/chexsystems/consumerdebit/page/securityalert/disputeprocess/",
    freezeUrl: "https://www.chexsystems.com/security-freeze",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  {
    id: "corelogic",
    name: "CoreLogic SafeRent",
    description: "Tenant screening (rental history, evictions, criminal records)",
    website: "https://www.corelogic.com/products/saferent.aspx",
    reportUrl: "https://www.corelogic.com/products/saferent-screening-report-request.aspx",
    disputeUrl: "https://www.corelogic.com/products/saferent-dispute.aspx",
    freezeUrl: null,
    color: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  {
    id: "clarity",
    name: "Clarity Services",
    description: "Alternative financial services (title loans, check cashing)",
    website: "https://www.clarityservices.com",
    reportUrl: "https://www.clarityservices.com/consumers/request-credit-report/",
    disputeUrl: "https://www.clarityservices.com/consumers/dispute-credit-report/",
    freezeUrl: "https://www.clarityservices.com/consumers/security-freeze/",
    color: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  },
];

export default function AlternativeBureaus() {
  const [selectedBureau, setSelectedBureau] = useState<string | null>(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const { data: actions, refetch } = trpc.privacy.list.useQuery();
  
  const createAction = trpc.privacy.create.useMutation({
    onSuccess: () => {
      toast.success("Privacy action recorded");
      refetch();
    },
  });

  const handleBulkRequest = () => {
    toast.success("Opening all report request pages...");
    ALTERNATIVE_BUREAUS.forEach(bureau => {
      window.open(bureau.reportUrl, "_blank");
    });
  };

  const handleRecordAction = (bureauId: string, actionType: string) => {
    const bureau = ALTERNATIVE_BUREAUS.find(b => b.id === bureauId);
    if (!bureau) return;

    createAction.mutate({
      actionType: "other",
      bureau: "equifax" as any, // Using equifax as placeholder for alternative bureaus
      actionDate: new Date().toISOString(),
      notes: `${actionType} for ${bureau.name} (${bureauId})`,
    });
  };

  const getBureauStatus = (bureauId: string) => {
    const bureauActions = actions?.filter((a: any) => a.bureau === bureauId);
    if (!bureauActions || bureauActions.length === 0) return null;
    
    const latestAction = bureauActions.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    return latestAction;
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Alternative Credit Bureaus</h1>
          <p className="text-muted-foreground">
            Manage your profile across the 6 major alternative credit reporting agencies
          </p>
        </div>
        <Button size="lg" onClick={handleBulkRequest} className="gap-2">
          <Download className="w-4 h-4" />
          Request All Reports
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Why Alternative Bureaus Matter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Most people only focus on the Big 3 (Equifax, Experian, TransUnion), but alternative bureaus can impact:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Insurance rates</strong> - LexisNexis affects auto and home insurance pricing</li>
            <li><strong>Bank accounts</strong> - ChexSystems can prevent you from opening checking accounts</li>
            <li><strong>Rental applications</strong> - CoreLogic SafeRent is used by landlords nationwide</li>
            <li><strong>Alternative credit</strong> - Innovis, SageStream, and Clarity track subprime lending</li>
          </ul>
        </CardContent>
      </Card>

      {/* Bureau Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ALTERNATIVE_BUREAUS.map((bureau) => {
          const status = getBureauStatus(bureau.id);
          
          return (
            <Card key={bureau.id} className="elegant-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">{bureau.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {bureau.description}
                    </CardDescription>
                  </div>
                  {status && (
                    <Badge className={bureau.color}>
                      {status.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {status.status === "pending" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {status.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                      {status.actionType}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => {
                      window.open(bureau.reportUrl, "_blank");
                      handleRecordAction(bureau.id, "report_request");
                    }}
                  >
                    Request Report
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => {
                      window.open(bureau.disputeUrl, "_blank");
                      handleRecordAction(bureau.id, "dispute");
                    }}
                  >
                    File Dispute
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  
                  {bureau.freezeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => {
                        window.open(bureau.freezeUrl, "_blank");
                        handleRecordAction(bureau.id, "security_freeze");
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Security Freeze
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => {
                      window.open(bureau.website, "_blank");
                      handleRecordAction(bureau.id, "opt_out");
                    }}
                  >
                    Opt-Out
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                {status && (
                  <div className="pt-3 border-t text-xs text-muted-foreground">
                    <p>Last action: {new Date(status.createdAt).toLocaleDateString()}</p>
                    {status.confirmationNumber && (
                      <p className="font-mono">Conf: {status.confirmationNumber}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action History */}
      {actions && actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>Your alternative bureau activity history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actions.slice(0, 10).map((action: any) => {
                const bureau = ALTERNATIVE_BUREAUS.find(b => b.id === action.bureau);
                return (
                  <div key={action.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{bureau?.name || action.bureau}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {action.actionType.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={
                        action.status === "completed" ? "border-green-500/50 text-green-700" :
                        action.status === "pending" ? "border-amber-500/50 text-amber-700" :
                        "border-red-500/50 text-red-700"
                      }>
                        {action.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(action.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
