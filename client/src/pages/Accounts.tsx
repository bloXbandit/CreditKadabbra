import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const { data: accounts } = trpc.accounts.list.useQuery();
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Accounts</h1>
          <p className="text-muted-foreground">Manage your credit accounts</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Total accounts: {accounts?.length || 0}</p>
      </CardContent></Card>
    </div>
  );
}
