import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ReportUpload() {
  const [, setLocation] = useLocation();
  const [reportText, setReportText] = useState("");
  const [bureau, setBureau] = useState<"equifax" | "experian" | "transunion">("experian");
  const [reportedScore, setReportedScore] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = trpc.reportUpload.parseAndGenerateScore.useMutation({
    onSuccess: (data) => {
      toast.success(`Report uploaded successfully! Created ${data.accountsCreated} accounts.`);
      
      // Show bureau scores
      data.bureauScores.forEach(bs => {
        const badge = bs.isSimulated ? " (Simulated)" : " (Actual)";
        toast.info(`${bs.bureau}: ${bs.score}${badge}`);
      });
      
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setReportText(event.target?.result as string);
          toast.success("File loaded successfully!");
        };
        reader.readAsText(file);
      } else {
        toast.error("Please upload a text file (.txt)");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReportText(event.target?.result as string);
        toast.success("File loaded successfully!");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    if (!reportText.trim()) {
      toast.error("Please paste or upload your credit report");
      return;
    }

    uploadMutation.mutate({
      reportText,
      bureau,
      reportedScore: reportedScore ? parseInt(reportedScore) : undefined,
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Credit Report</h1>
        <p className="text-muted-foreground">
          Upload your credit report to automatically extract accounts and calculate scores
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose Upload Method</CardTitle>
            <CardDescription>
              Drag and drop a text file or paste your credit report text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-border"}
                hover:border-primary/50 cursor-pointer
              `}
            >
              <input
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop your credit report here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <Badge variant="outline">Accepts .txt files</Badge>
              </label>
            </div>

            {/* Text Paste Option */}
            <div className="space-y-2">
              <Label htmlFor="report-text">Or paste your credit report text</Label>
              <Textarea
                id="report-text"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Paste your credit report text here..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {reportText.length} characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Details */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Report Details</CardTitle>
            <CardDescription>
              Tell us which bureau this report is from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bureau">Credit Bureau</Label>
              <Select value={bureau} onValueChange={(v: any) => setBureau(v)}>
                <SelectTrigger id="bureau">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equifax">Equifax</SelectItem>
                  <SelectItem value="experian">Experian</SelectItem>
                  <SelectItem value="transunion">TransUnion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Credit Score (Optional)</Label>
              <Input
                id="score"
                type="number"
                min="300"
                max="850"
                value={reportedScore}
                onChange={(e) => setReportedScore(e.target.value)}
                placeholder="e.g., 720"
              />
              <p className="text-xs text-muted-foreground">
                If your report includes a score, enter it here. Otherwise, we'll calculate it automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Automatic Parsing</p>
                <p className="text-sm text-muted-foreground">
                  We'll extract all accounts, inquiries, and public records from your report
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Score Generation</p>
                <p className="text-sm text-muted-foreground">
                  If no score is provided, we'll calculate one using FICO factors
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Bureau Simulation</p>
                <p className="text-sm text-muted-foreground">
                  We'll estimate scores for the other two bureaus (marked as "Simulated")
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Privacy Note</p>
                <p className="text-sm text-muted-foreground">
                  Your report data is stored securely and never shared with third parties
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || !reportText.trim()}
            className="flex-1"
            size="lg"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Report...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Process Report
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
