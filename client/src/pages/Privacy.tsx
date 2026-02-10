import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function Privacy() {
  const { data: privacyActions } = trpc.privacy.list.useQuery();
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Privacy Controls</h1>
          <p className="text-muted-foreground">Manage data sharing preferences</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}>
          <Shield className="mr-2 h-4 w-4" />
          Add Privacy Action
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Total actions: {privacyActions?.length || 0}</p>
      </CardContent></Card>
    </div>
  );
}
