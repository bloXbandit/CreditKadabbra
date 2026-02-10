#!/bin/bash

# Create Accounts.tsx
cat > Accounts.tsx << 'EOF'
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
EOF

# Create Disputes.tsx
cat > Disputes.tsx << 'EOF'
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
EOF

# Create Wayfinder.tsx
cat > Wayfinder.tsx << 'EOF'
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
EOF

# Create Tasks.tsx
cat > Tasks.tsx << 'EOF'
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
EOF

# Create Documents.tsx
cat > Documents.tsx << 'EOF'
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
EOF

# Create Privacy.tsx
cat > Privacy.tsx << 'EOF'
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
EOF

# Create Progress.tsx
cat > Progress.tsx << 'EOF'
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
EOF

echo "All pages created successfully"
