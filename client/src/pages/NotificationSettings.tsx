import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Bell, Mail, TrendingUp, AlertTriangle, FileText, CreditCard } from "lucide-react";

export default function NotificationSettings() {
  const { data: preferences, isLoading, refetch } = trpc.notifications.getPreferences.useQuery();
  const updatePreferences = trpc.notifications.updatePreferences.useMutation();
  
  const [localPrefs, setLocalPrefs] = useState<any>(null);
  
  // Initialize local state when data loads
  if (preferences && !localPrefs) {
    setLocalPrefs(preferences);
  }
  
  const handleToggle = (key: string, value: boolean) => {
    setLocalPrefs({ ...localPrefs, [key]: value });
  };
  
  const handleNumberChange = (key: string, value: number) => {
    setLocalPrefs({ ...localPrefs, [key]: value });
  };
  
  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync(localPrefs);
      await refetch();
      toast.success("Notification preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };
  
  if (isLoading || !localPrefs) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground mb-6">Loading your preferences...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-8 w-8 text-[#dc2626]" />
          <h1 className="text-3xl font-bold">Notification Settings</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Manage your email notification preferences and stay on top of your credit repair journey.
        </p>
        
        <div className="space-y-6">
          {/* Payment Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-[#dc2626]" />
                <div>
                  <CardTitle>Payment Reminders</CardTitle>
                  <CardDescription>
                    Get notified when your optimal payment dates are approaching
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-reminders">Enable Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email reminders before your optimal payment dates
                  </p>
                </div>
                <Switch
                  id="payment-reminders"
                  checked={localPrefs.paymentReminders}
                  onCheckedChange={(checked) => handleToggle('paymentReminders', checked)}
                />
              </div>
              
              {localPrefs.paymentReminders && (
                <div className="space-y-2 pl-4 border-l-2 border-[#f59e0b]">
                  <Label htmlFor="reminder-days">Reminder Timing</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="reminder-days"
                      type="number"
                      min={1}
                      max={7}
                      value={localPrefs.paymentReminderDays}
                      onChange={(e) => handleNumberChange('paymentReminderDays', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      days before optimal payment date
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send you a reminder {localPrefs.paymentReminderDays} day{localPrefs.paymentReminderDays !== 1 ? 's' : ''} before your optimal payment window.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Dispute Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#dc2626]" />
                <div>
                  <CardTitle>Dispute Deadlines</CardTitle>
                  <CardDescription>
                    Track the 30-day bureau investigation deadline
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dispute-deadlines">Enable Dispute Deadline Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified at key milestones (7 days, 3 days, 1 day, deadline)
                  </p>
                </div>
                <Switch
                  id="dispute-deadlines"
                  checked={localPrefs.disputeDeadlines}
                  onCheckedChange={(checked) => handleToggle('disputeDeadlines', checked)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Bureau Responses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-[#dc2626]" />
                <div>
                  <CardTitle>Bureau Responses</CardTitle>
                  <CardDescription>
                    Get notified when bureaus respond to your disputes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bureau-responses">Enable Bureau Response Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts when dispute statuses change
                  </p>
                </div>
                <Switch
                  id="bureau-responses"
                  checked={localPrefs.bureauResponses}
                  onCheckedChange={(checked) => handleToggle('bureauResponses', checked)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Score Updates */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-[#dc2626]" />
                <div>
                  <CardTitle>Score Updates</CardTitle>
                  <CardDescription>
                    Get notified about significant credit score changes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="score-updates">Enable Score Update Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts when your credit scores improve or decline
                  </p>
                </div>
                <Switch
                  id="score-updates"
                  checked={localPrefs.scoreUpdates}
                  onCheckedChange={(checked) => handleToggle('scoreUpdates', checked)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Utilization Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-[#dc2626]" />
                <div>
                  <CardTitle>Utilization Alerts</CardTitle>
                  <CardDescription>
                    Get warned when credit card utilization gets too high
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="utilization-alerts">Enable Utilization Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts when utilization exceeds your threshold
                  </p>
                </div>
                <Switch
                  id="utilization-alerts"
                  checked={localPrefs.utilizationAlerts}
                  onCheckedChange={(checked) => handleToggle('utilizationAlerts', checked)}
                />
              </div>
              
              {localPrefs.utilizationAlerts && (
                <div className="space-y-2 pl-4 border-l-2 border-[#f59e0b]">
                  <Label htmlFor="utilization-threshold">Alert Threshold</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="utilization-threshold"
                      type="number"
                      min={10}
                      max={90}
                      value={localPrefs.utilizationThreshold}
                      onChange={(e) => handleNumberChange('utilizationThreshold', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      % utilization
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll alert you when any credit card exceeds {localPrefs.utilizationThreshold}% utilization.
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-2">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Pro Tip:</strong> Keep utilization below 30% for good scores, below 10% for excellent scores.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setLocalPrefs(preferences)}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePreferences.isPending}
              className="bg-[#dc2626] hover:bg-[#b91c1c]"
            >
              {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
          
          {/* Info Box */}
          <Card className="bg-gradient-to-r from-[#dc2626]/10 to-[#f59e0b]/10 border-[#dc2626]/20">
            <CardHeader>
              <CardTitle className="text-lg">📧 About Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                All notifications are sent to the email address associated with your account. Make sure your email is up to date in your profile settings.
              </p>
              <p>
                <strong>Note:</strong> This is a demonstration system. In production, notifications would be sent via a professional email service (SendGrid, AWS SES, etc.). Currently, notifications are logged to the system for testing purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
