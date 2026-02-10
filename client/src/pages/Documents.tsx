import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export default function Documents() {
  const { data: documents } = trpc.documents.list.useQuery();
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage your credit documents</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Total documents: {documents?.length || 0}</p>
      </CardContent></Card>
    </div>
  );
}
