import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

export default function Scores() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [bureau, setBureau] = useState<"equifax" | "experian" | "transunion">("equifax");
  const [score, setScore] = useState("");
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [goalNotes, setGoalNotes] = useState("");

  const { data: allScores, isLoading, refetch } = trpc.scores.list.useQuery();
  const { data: latestScores } = trpc.scores.latest.useQuery();
  const { data: goals, refetch: refetchGoals } = trpc.goals.list.useQuery();
  const createScore = trpc.scores.create.useMutation();
  const createGoal = trpc.goals.create.useMutation();

  const activeGoal = goals?.find(g => !g.achieved);

  const handleAddScore = async () => {
    if (!score || !scoreDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createScore.mutateAsync({
        bureau,
        score: parseInt(score),
        scoreDate,
        notes: notes || undefined,
      });
      toast.success("Credit score added successfully");
      setDialogOpen(false);
      setScore("");
      setNotes("");
      refetch();
    } catch (error) {
      toast.error("Failed to add credit score");
    }
  };

  const handleSetGoal = async () => {
    if (!targetScore) {
      toast.error("Please enter a target score");
      return;
    }

    try {
      await createGoal.mutateAsync({
        targetScore: parseInt(targetScore),
        targetDate: targetDate || undefined,
        notes: goalNotes || undefined,
      });
      toast.success("Score goal set successfully");
      setGoalDialogOpen(false);
      setTargetScore("");
      setTargetDate("");
      setGoalNotes("");
      refetchGoals();
    } catch (error) {
      toast.error("Failed to set score goal");
    }
  };

  // Prepare chart data
  const chartData = allScores?.map(s => ({
    date: new Date(s.scoreDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    [s.bureau]: s.score,
    fullDate: s.scoreDate,
  })) || [];

  // Group by date and merge bureaus
  const mergedData = chartData.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      Object.assign(existing, curr);
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  // Sort by date
  mergedData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Scores</h1>
          <p className="text-muted-foreground">Track your credit scores across all three bureaus</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                {activeGoal ? 'Update Goal' : 'Set Goal'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Score Goal</DialogTitle>
                <DialogDescription>Define your target credit score</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="targetScore">Target Score *</Label>
                  <Input
                    id="targetScore"
                    type="number"
                    min="300"
                    max="850"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    placeholder="e.g., 750"
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date (Optional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="goalNotes">Notes (Optional)</Label>
                  <Textarea
                    id="goalNotes"
                    value={goalNotes}
                    onChange={(e) => setGoalNotes(e.target.value)}
                    placeholder="Why this goal matters to you..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSetGoal}>Set Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Score
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credit Score</DialogTitle>
                <DialogDescription>Record a new credit score from any bureau</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bureau">Bureau *</Label>
                  <Select value={bureau} onValueChange={(v: any) => setBureau(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equifax">Equifax</SelectItem>
                      <SelectItem value="experian">Experian</SelectItem>
                      <SelectItem value="transunion">TransUnion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="score">Score *</Label>
                  <Input
                    id="score"
                    type="number"
                    min="300"
                    max="850"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g., 720"
                  />
                </div>
                <div>
                  <Label htmlFor="scoreDate">Date *</Label>
                  <Input
                    id="scoreDate"
                    type="date"
                    value={scoreDate}
                    onChange={(e) => setScoreDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations or context..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddScore}>Add Score</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Scores */}
      <div className="grid gap-6 md:grid-cols-3">
        {['equifax', 'experian', 'transunion'].map((b) => {
          const currentScore = latestScores?.find(s => s.bureau === b);
          const previousScores = allScores?.filter(s => s.bureau === b).sort((a, b) => 
            new Date(b.scoreDate).getTime() - new Date(a.scoreDate).getTime()
          );
          const previousScore = previousScores && previousScores.length > 1 ? previousScores[1] : null;
          const change = currentScore && previousScore ? currentScore.score - previousScore.score : 0;

          return (
            <Card key={b} className="elegant-card">
              <CardHeader>
                <CardTitle className="capitalize text-lg">{b}</CardTitle>
                <CardDescription>
                  {currentScore ? new Date(currentScore.scoreDate).toLocaleDateString() : 'No data'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{currentScore?.score || '—'}</span>
                  {change !== 0 && (
                    <div className={`flex items-center text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="ml-1">{Math.abs(change)}</span>
                    </div>
                  )}
                </div>
                {activeGoal && currentScore && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Goal: {activeGoal.targetScore}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeGoal.targetScore - currentScore.score} points to go
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Score History Chart */}
      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>Score History</CardTitle>
          <CardDescription>Track your credit score changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart...</p>
            </div>
          ) : mergedData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">No score history yet. Add your first score to see the chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[300, 850]} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="equifax" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Equifax" />
                <Line type="monotone" dataKey="experian" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Experian" />
                <Line type="monotone" dataKey="transunion" stroke="hsl(var(--chart-3))" strokeWidth={2} name="TransUnion" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
