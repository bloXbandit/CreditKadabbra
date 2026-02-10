import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Wayfinder() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Wayfinder</h1>
        <p className="text-muted-foreground">Simulate credit score improvements</p>
      </div>
      <Card><CardContent className="p-6">
        <Button onClick={() => toast.info("Feature coming soon")} className="w-full">
          <TrendingUp className="mr-2 h-4 w-4" />
          Run Scenario Simulation
        </Button>
      </CardContent></Card>
    </div>
  );
}
