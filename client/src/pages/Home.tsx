import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Target, FileCheck, ArrowRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const { data: latestScores, isLoading: scoresLoading } = trpc.scores.latest.useQuery();
  const { data: disputes, isLoading: disputesLoading } = trpc.disputes.list.useQuery();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: goals, isLoading: goalsLoading } = trpc.goals.list.useQuery();

  const pendingDisputes = disputes?.filter(d => d.status === 'sent' || d.status === 'in_progress').length || 0;
  const pendingTasks = tasks?.filter(t => !t.completed).length || 0;
  const activeGoal = goals?.find(g => !g.achieved);

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">Credit Repair Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your credit journey and take control of your financial future</p>
      </div>

      {/* Credit Scores Overview */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {scoresLoading ? (
          <>
            <Card className="animate-pulse"><CardContent className="h-32" /></Card>
            <Card className="animate-pulse"><CardContent className="h-32" /></Card>
            <Card className="animate-pulse"><CardContent className="h-32" /></Card>
          </>
        ) : (
          <>
            {['equifax', 'experian', 'transunion'].map((bureau) => {
              const score = latestScores?.find(s => s.bureau === bureau);
              return (
                <Card key={bureau} className="elegant-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/scores')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                      {bureau}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl font-bold">
                        {score?.score || '—'}
                      </div>
                      {score?.notes?.includes('Simulated') && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <Info className="w-3 h-3 mr-1" />
                              Simulated
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">{score.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {score && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(score.scoreDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingDisputes}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-2" 
              onClick={() => navigate('/disputes')}
            >
              View all disputes <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingTasks}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-2" 
              onClick={() => navigate('/tasks')}
            >
              View all tasks <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Score Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeGoal?.targetScore || '—'}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-2" 
              onClick={() => navigate('/scores')}
            >
              {activeGoal ? 'Track progress' : 'Set a goal'} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="elegant-card gradient-accent text-accent-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wayfinder</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">Simulate score improvements</p>
            <Button 
              variant="secondary" 
              size="sm"
              className="w-full"
              onClick={() => navigate('/wayfinder')}
            >
              Run Scenario
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to improve your credit</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" onClick={() => navigate('/scores')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Add Credit Score
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/disputes')}>
            <AlertCircle className="mr-2 h-4 w-4" />
            File Dispute
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/accounts')}>
            <FileCheck className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/documents')}>
            <FileCheck className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
