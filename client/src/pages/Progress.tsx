import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";

export default function Progress() {
  const { data: milestones } = trpc.milestones.list.useQuery();
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground">Track your credit repair journey</p>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Total milestones: {milestones?.length || 0}</p>
      </CardContent></Card>
    </div>
  );
}
