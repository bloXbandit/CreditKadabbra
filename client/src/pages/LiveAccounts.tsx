import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, CreditCard, Home, Car, Wallet, TrendingUp, Edit2, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type AccountType = "credit_card" | "mortgage" | "auto_loan" | "personal_loan" | "student_loan" | "other";

export default function LiveAccounts() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterType, setFilterType] = useState<AccountType | "all">("all");
  const [editingField, setEditingField] = useState<{ accountId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const { data: accounts, isLoading, refetch } = trpc.liveAccounts.list.useQuery();
  const createAccount = trpc.liveAccounts.create.useMutation({
    onSuccess: () => {
      toast.success("Account added successfully");
      refetch();
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add account: ${error.message}`);
    },
  });

  const updateAccount = trpc.liveAccounts.update.useMutation({
    onSuccess: () => {
      toast.success("Account updated");
      refetch();
    },
  });

  const deleteAccount = trpc.liveAccounts.delete.useMutation({
    onSuccess: () => {
      toast.success("Account deleted");
      refetch();
    },
  });

  // Form state
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("credit_card");
  const [balance, setBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");

  const resetForm = () => {
    setAccountName("");
    setAccountType("credit_card");
    setBalance("");
    setCreditLimit("");
    setStatementDate("");
    setDueDate("");
    setInterestRate("");
    setMinimumPayment("");
  };

  // Auto-calculate utilization
  const utilization = balance && creditLimit ? (parseFloat(balance) / parseFloat(creditLimit)) * 100 : 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsAddOpen(true);
      }
      if (e.key === "Escape" && isAddOpen) {
        setIsAddOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createAccount.mutate({
      accountName,
      accountType,
      currentBalance: balance ? parseFloat(balance) : undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      statementDate: statementDate ? parseInt(statementDate) : undefined,
      paymentDueDate: dueDate ? parseInt(dueDate) : undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      minimumPayment: minimumPayment ? parseFloat(minimumPayment) : undefined,
    });
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case "credit_card": return CreditCard;
      case "mortgage": return Home;
      case "auto_loan": return Car;
      default: return Wallet;
    }
  };

  const getUtilizationColor = (util: number) => {
    if (util < 30) return "text-green-600";
    if (util < 50) return "text-amber-600";
    return "text-red-600";
  };

  const filteredAccounts = accounts?.filter(acc => 
    filterType === "all" || acc.accountType === filterType
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Live Accounts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your credit cards, loans, and mortgages in real-time</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Account
              <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Quickly add a credit card, loan, or mortgage to track
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    placeholder="Chase Freedom, Wells Fargo Mortgage..."
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="mortgage">Mortgage</SelectItem>
                      <SelectItem value="auto_loan">Auto Loan</SelectItem>
                      <SelectItem value="personal_loan">Personal Loan</SelectItem>
                      <SelectItem value="student_loan">Student Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="balance">Current Balance *</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    required
                  />
                </div>
                {accountType === "credit_card" && (
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {accountType === "credit_card" && creditLimit && balance && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Utilization</span>
                    <span className={`text-2xl font-bold ${getUtilizationColor(utilization)}`}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={utilization} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {utilization < 30 ? "✓ Excellent - Keep it under 30%" : 
                     utilization < 50 ? "⚠ Fair - Try to get below 30%" : 
                     "✗ High - Pay down balance to improve score"}
                  </p>
                </div>
              )}

              {accountType === "credit_card" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="statementDate">Statement Date (Day of Month)</Label>
                    <Input
                      id="statementDate"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={statementDate}
                      onChange={(e) => setStatementDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
                    <Input
                      id="dueDate"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="10"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="18.99"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Minimum Payment</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={minimumPayment}
                    onChange={(e) => setMinimumPayment(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAccount.isPending}>
                  {createAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All ({accounts?.length || 0})
        </Button>
        <Button
          variant={filterType === "credit_card" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("credit_card")}
        >
          Credit Cards ({accounts?.filter(a => a.accountType === "credit_card").length || 0})
        </Button>
        <Button
          variant={filterType === "mortgage" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("mortgage")}
        >
          Mortgages ({accounts?.filter(a => a.accountType === "mortgage").length || 0})
        </Button>
        <Button
          variant={filterType === "auto_loan" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("auto_loan")}
        >
          Auto Loans ({accounts?.filter(a => a.accountType === "auto_loan").length || 0})
        </Button>
      </div>

      {/* Accounts Grid */}
      {!filteredAccounts || filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first account to start tracking your credit in real-time
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => {
            const Icon = getAccountIcon(account.accountType);
            const util = account.creditLimit ? (parseFloat(account.currentBalance || "0") / parseFloat(account.creditLimit)) * 100 : 0;
            
            return (
              <Card key={account.id} className="elegant-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.accountName}</CardTitle>
                        <CardDescription className="capitalize">
                          {account.accountType.replace("_", " ")}
                        </CardDescription>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {account.accountName}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAccount.mutate({ id: account.id })}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      {editingField?.accountId === account.id && editingField?.field === "balance" ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            updateAccount.mutate({
                              id: account.id,
                              currentBalance: parseFloat(editValue),
                            });
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateAccount.mutate({
                                id: account.id,
                                currentBalance: parseFloat(editValue),
                              });
                              setEditingField(null);
                            } else if (e.key === "Escape") {
                              setEditingField(null);
                            }
                          }}
                          className="text-2xl font-bold text-right w-32 h-8"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            setEditingField({ accountId: account.id, field: "balance" });
                            setEditValue(account.currentBalance || "0");
                          }}
                          title="Click to edit"
                        >
                          ${parseFloat(account.currentBalance || "0").toLocaleString()}
                        </span>
                      )}
                    </div>
                    {account.creditLimit && (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          {editingField?.accountId === account.id && editingField?.field === "limit" ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                updateAccount.mutate({
                                  id: account.id,
                                  creditLimit: parseFloat(editValue),
                                });
                                setEditingField(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateAccount.mutate({
                                    id: account.id,
                                    creditLimit: parseFloat(editValue),
                                  });
                                  setEditingField(null);
                                } else if (e.key === "Escape") {
                                  setEditingField(null);
                                }
                              }}
                              className="text-xs w-24 h-6"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => {
                                setEditingField({ accountId: account.id, field: "limit" });
                                setEditValue(account.creditLimit || "0");
                              }}
                              title="Click to edit"
                            >
                              Limit: ${parseFloat(account.creditLimit).toLocaleString()}
                            </span>
                          )}
                          <span className={getUtilizationColor(util)}>{util.toFixed(1)}%</span>
                        </div>
                        <Progress value={util} className="h-2" />
                      </>
                    )}
                  </div>

                  {account.statementDate && account.paymentDueDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Statement: {account.statementDate}th | Due: {account.paymentDueDate}th</span>
                    </div>
                  )}

                  {account.interestRate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">APR</span>
                      <span className="font-medium">{account.interestRate}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
