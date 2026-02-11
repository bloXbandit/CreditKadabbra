import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, AlertCircle, CheckCircle, Clock, XCircle, FileText, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DisputeStatus = "draft" | "sent" | "in_progress" | "resolved" | "rejected";
type Bureau = "equifax" | "experian" | "transunion";

export default function DisputesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | "all">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedCitations, setSelectedCitations] = useState<number[]>([]);
  const [letterPreview, setLetterPreview] = useState("");

  const { data: disputes, isLoading, refetch } = trpc.disputes.list.useQuery();
  const { data: templates } = trpc.letterTemplates.list.useQuery();
  const { data: citations } = trpc.legalCitations.list.useQuery();
  const { data: accounts } = trpc.accounts.list.useQuery();

  const createDispute = trpc.disputes.create.useMutation({
    onSuccess: () => {
      toast.success("Dispute created successfully");
      refetch();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create dispute: ${error.message}`);
    },
  });

  const generateLetter = trpc.letterTemplates.generate.useMutation({
    onSuccess: (data) => {
      setLetterPreview(data.letter);
      toast.success("Letter generated");
    },
  });

  // Form state
  const [disputeReason, setDisputeReason] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [customLetter, setCustomLetter] = useState("");

  const resetForm = () => {
    setDisputeReason("");
    setAccountId("");
    setBureaus([]);
    setSelectedTemplate(null);
    setSelectedCitations([]);
    setCustomLetter("");
    setLetterPreview("");
  };

  const handleBureauToggle = (bureau: Bureau) => {
    setBureaus(prev =>
      prev.includes(bureau)
        ? prev.filter(b => b !== bureau)
        : [...prev, bureau]
    );
  };

  const handleGenerateLetter = () => {
    if (!selectedTemplate) {
      toast.error("Please select a letter template");
      return;
    }

    generateLetter.mutate({
      templateId: selectedTemplate,
      variables: {
        reason: disputeReason,
        accountId: accountId || "",
        citations: selectedCitations.join(", "),
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (bureaus.length === 0) {
      toast.error("Please select at least one bureau");
      return;
    }

    const letterToUse = letterPreview || customLetter;
    if (!letterToUse) {
      toast.error("Please generate or write a dispute letter");
      return;
    }

    // Create a dispute for each selected bureau
    bureaus.forEach(bureau => {
      createDispute.mutate({
        itemId: accountId ? parseInt(accountId) : undefined,
        itemType: "account",
        bureau,
        disputeReason,
        letterContent: letterToUse,
        status: "draft",
      });
    });
  };

  const getStatusIcon = (status: DisputeStatus) => {
    switch (status) {
      case "draft": return Clock;
      case "sent": return Send;
      case "in_progress": return AlertCircle;
      case "resolved": return CheckCircle;
      case "rejected": return XCircle;
    }
  };

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case "draft": return "bg-gray-500/10 text-gray-700 border-gray-500/20";
      case "sent": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "in_progress": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "resolved": return "bg-green-500/10 text-green-700 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-700 border-red-500/20";
    }
  };

  const filteredDisputes = disputes?.filter(d =>
    filterStatus === "all" || d.status === filterStatus
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dispute Management</h1>
          <p className="text-muted-foreground">
            Challenge inaccurate items with legally-backed dispute letters
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              File Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>File New Dispute</DialogTitle>
              <DialogDescription>
                Create a legally-backed dispute letter with citations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="letter">Letter Generator</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountId">Account (Optional)</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account to dispute" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map(acc => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>
                            {acc.accountName} - {acc.accountNumber || "No account #"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disputeReason">Dispute Reason *</Label>
                    <Textarea
                      id="disputeReason"
                      placeholder="Describe the inaccuracy or error..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Select Bureaus *</Label>
                    <div className="grid gap-3">
                      {(["equifax", "experian", "transunion"] as Bureau[]).map(bureau => (
                        <div key={bureau} className="flex items-center space-x-2">
                          <Checkbox
                            id={bureau}
                            checked={bureaus.includes(bureau)}
                            onCheckedChange={() => handleBureauToggle(bureau)}
                          />
                          <Label htmlFor={bureau} className="capitalize cursor-pointer">
                            {bureau}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="letter" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Letter Template</Label>
                    <Select
                      value={selectedTemplate?.toString() || ""}
                      onValueChange={(v) => setSelectedTemplate(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.templateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Legal Citations (Optional)</Label>
                    <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                      {citations?.map(citation => (
                        <div key={citation.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`citation-${citation.id}`}
                            checked={selectedCitations.includes(citation.id)}
                            onCheckedChange={(checked) => {
                              setSelectedCitations(prev =>
                                checked
                                  ? [...prev, citation.id]
                                  : prev.filter(id => id !== citation.id)
                              );
                            }}
                          />
                          <Label
                            htmlFor={`citation-${citation.id}`}
                            className="cursor-pointer text-sm leading-relaxed"
                          >
                            <span className="font-semibold">{citation.statute}</span>
                            {" - "}
                            {citation.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateLetter}
                    disabled={!selectedTemplate || generateLetter.isPending}
                    className="w-full"
                  >
                    {generateLetter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Letter
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Or Write Custom Letter</Label>
                    <Textarea
                      placeholder="Write your own dispute letter..."
                      value={customLetter}
                      onChange={(e) => setCustomLetter(e.target.value)}
                      rows={8}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  {letterPreview || customLetter ? (
                    <div className="border rounded-lg p-6 bg-muted/30 min-h-[400px]">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {letterPreview || customLetter}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-12 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No letter generated yet</p>
                      <p className="text-sm">Go to Letter Generator tab to create one</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDispute.isPending}>
                  {createDispute.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Dispute
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All ({disputes?.length || 0})
        </Button>
        {(["draft", "sent", "in_progress", "resolved", "rejected"] as DisputeStatus[]).map(status => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status.replace("_", " ")} ({disputes?.filter(d => d.status === status).length || 0})
          </Button>
        ))}
      </div>

      {/* Disputes List */}
      {!filteredDisputes || filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Disputes Yet</h3>
              <p className="text-muted-foreground mb-4">
                File your first dispute to challenge inaccurate credit report items
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                File Dispute
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDisputes.map((dispute) => {
            const StatusIcon = getStatusIcon(dispute.status);
            
            return (
              <Card key={dispute.id} className="elegant-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge className={getStatusColor(dispute.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {dispute.status.replace("_", " ")}
                        </Badge>
                        <span className="capitalize">{dispute.bureau}</span>
                      </CardTitle>
                      <CardDescription>
                        Filed {new Date(dispute.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Dispute Reason</p>
                    <p className="text-sm text-muted-foreground">{dispute.disputeReason}</p>
                  </div>
                  {dispute.outcome && (
                    <div>
                      <p className="text-sm font-medium mb-1">Outcome</p>
                      <p className="text-sm text-muted-foreground">{dispute.outcome}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
