import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Disputes() {
  const { data: disputes, refetch } = trpc.disputes.list.useQuery();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [mailingDate, setMailingDate] = useState('');
  
  const updateDispute = trpc.disputes.update.useMutation({
    onSuccess: () => {
      toast.success('Dispute updated successfully');
      refetch();
      setSelectedDispute(null);
      setTrackingNumber('');
      setMailingDate('');
    },
    onError: (error) => {
      toast.error(`Failed to update dispute: ${error.message}`);
    },
  });

  const handleAddTracking = () => {
    if (!selectedDispute || !trackingNumber || !mailingDate) {
      toast.error('Please fill in all fields');
      return;
    }

    updateDispute.mutate({
      id: selectedDispute.id,
      certifiedMailTracking: trackingNumber,
      mailingDate: mailingDate,
      status: 'sent',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      draft: { variant: 'secondary', icon: Clock },
      sent: { variant: 'default', icon: Package },
      in_progress: { variant: 'default', icon: Clock },
      resolved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: AlertTriangle },
    };
    
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue by {Math.abs(diffDays)} days
        </Badge>
      );
    }
    
    if (diffDays <= 7) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Clock className="h-3 w-3" />
          {diffDays} days remaining
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {diffDays} days remaining
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disputes</h1>
          <p className="text-muted-foreground">Track credit report disputes and deadlines</p>
        </div>
        <Button onClick={() => toast.info('Feature coming soon')}>
          <Plus className="mr-2 h-4 w-4" />
          File Dispute
        </Button>
      </div>

      <div className="grid gap-4">
        {disputes && disputes.length > 0 ? (
          disputes.map((dispute: any) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {dispute.bureau.charAt(0).toUpperCase() + dispute.bureau.slice(1)} - {dispute.itemType.replace('_', ' ')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{dispute.disputeReason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(dispute.status)}
                    {dispute.responseDeadline && getDeadlineStatus(dispute.responseDeadline)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                  </div>
                  {dispute.certifiedMailTracking && (
                    <div>
                      <p className="text-muted-foreground">Tracking Number</p>
                      <p className="font-medium font-mono">{dispute.certifiedMailTracking}</p>
                    </div>
                  )}
                  {dispute.mailingDate && (
                    <div>
                      <p className="text-muted-foreground">Mailed On</p>
                      <p className="font-medium">{new Date(dispute.mailingDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {dispute.responseDeadline && (
                    <div>
                      <p className="text-muted-foreground">Response Deadline</p>
                      <p className="font-medium">{new Date(dispute.responseDeadline).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                {!dispute.certifiedMailTracking && dispute.status === 'draft' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setSelectedDispute(dispute)}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Add Tracking Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Certified Mail Tracking</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="trackingNumber">USPS Tracking Number</Label>
                          <Input
                            id="trackingNumber"
                            placeholder="9400 1000 0000 0000 0000 00"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mailingDate">Mailing Date</Label>
                          <Input
                            id="mailingDate"
                            type="date"
                            value={mailingDate}
                            onChange={(e) => setMailingDate(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            30-day response deadline will be calculated automatically
                          </p>
                        </div>
                        <Button onClick={handleAddTracking} className="w-full">
                          Save Tracking Info
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No disputes yet. File your first dispute to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
