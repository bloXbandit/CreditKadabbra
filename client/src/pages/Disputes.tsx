import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Disputes() {
  const { data: disputes } = trpc.disputes.list.useQuery();
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disputes</h1>
          <p className="text-muted-foreground">Manage credit report disputes</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}>
          <Plus className="mr-2 h-4 w-4" />
          File Dispute
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Total disputes: {disputes?.length || 0}</p>
      </CardContent></Card>
    </div>
  );
}
