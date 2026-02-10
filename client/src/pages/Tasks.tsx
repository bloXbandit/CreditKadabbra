import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const { data: tasks } = trpc.tasks.list.useQuery();
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Track your credit repair tasks</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Total tasks: {tasks?.length || 0}</p>
      </CardContent></Card>
    </div>
  );
}
