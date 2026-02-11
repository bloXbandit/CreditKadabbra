import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Download, Copy, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DisputeLetterGenerator() {
  const [letterType, setLetterType] = useState<'inaccuracy' | 'validation' | 'goodwill' | 'identity_theft' | 'mixed_file'>('inaccuracy');
  const [bureau, setBureau] = useState<'equifax' | 'experian' | 'transunion'>('transunion');
  const [generatedLetter, setGeneratedLetter] = useState('');
  
  // User info form
  const [userInfo, setUserInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    ssn: '',
    dateOfBirth: '',
  });

  // Dispute items
  const [items, setItems] = useState<Array<{
    type: 'account' | 'inquiry' | 'public_record' | 'personal_info';
    description: string;
    accountNumber?: string;
    creditorName?: string;
    reason: string;
  }>>([{
    type: 'account',
    description: '',
    accountNumber: '',
    creditorName: '',
    reason: '',
  }]);

  const generateLetter = trpc.disputes.generateLetter.useMutation({
    onSuccess: (data) => {
      setGeneratedLetter(data.letterContent);
      toast.success('Dispute letter generated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to generate letter: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!userInfo.name || !userInfo.address || !userInfo.city || !userInfo.state || !userInfo.zip) {
      toast.error('Please fill in all required user information fields');
      return;
    }

    if (items.some(item => !item.description || !item.reason)) {
      toast.error('Please fill in description and reason for all items');
      return;
    }

    generateLetter.mutate({
      userInfo,
      bureau,
      items,
      letterType,
    });
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Letter copied to clipboard!');
  };

  const handleDownloadLetter = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispute-letter-${bureau}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Letter downloaded!');
  };

  const addItem = () => {
    setItems([...items, {
      type: 'account',
      description: '',
      accountNumber: '',
      creditorName: '',
      reason: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dispute Letter Generator</h1>
        <p className="text-muted-foreground">
          Generate customized dispute letters for credit bureaus based on FCRA guidelines
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These letters are templates based on Fair Credit Reporting Act (FCRA) requirements. 
          Review and customize the generated letter before sending. Always send via certified mail with return receipt.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Letter Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Letter Configuration</CardTitle>
              <CardDescription>Select the type of dispute letter and target bureau</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="letterType">Letter Type</Label>
                <Select value={letterType} onValueChange={(value: any) => setLetterType(value)}>
                  <SelectTrigger id="letterType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inaccuracy">Inaccuracy Dispute</SelectItem>
                    <SelectItem value="validation">Validation Request</SelectItem>
                    <SelectItem value="goodwill">Goodwill Letter</SelectItem>
                    <SelectItem value="identity_theft">Identity Theft</SelectItem>
                    <SelectItem value="mixed_file">Mixed File</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {letterType === 'inaccuracy' && 'Dispute inaccurate information on your credit report'}
                  {letterType === 'validation' && 'Request verification of reported information'}
                  {letterType === 'goodwill' && 'Request removal of negative items (sent to creditors)'}
                  {letterType === 'identity_theft' && 'Report fraudulent accounts from identity theft'}
                  {letterType === 'mixed_file' && 'Dispute information belonging to another person'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bureau">Credit Bureau</Label>
                <Select value={bureau} onValueChange={(value: any) => setBureau(value)}>
                  <SelectTrigger id="bureau">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equifax">Equifax</SelectItem>
                    <SelectItem value="experian">Experian</SelectItem>
                    <SelectItem value="transunion">TransUnion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Your Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Enter your personal details for the letter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={userInfo.address}
                  onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={userInfo.city}
                    onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={userInfo.state}
                    onChange={(e) => setUserInfo({ ...userInfo, state: e.target.value })}
                    placeholder="NY"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={userInfo.zip}
                  onChange={(e) => setUserInfo({ ...userInfo, zip: e.target.value })}
                  placeholder="10001"
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ssn">SSN (optional, last 4 digits shown)</Label>
                <Input
                  id="ssn"
                  value={userInfo.ssn}
                  onChange={(e) => setUserInfo({ ...userInfo, ssn: e.target.value })}
                  placeholder="123-45-6789"
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth (optional)</Label>
                <Input
                  id="dob"
                  type="date"
                  value={userInfo.dateOfBirth}
                  onChange={(e) => setUserInfo({ ...userInfo, dateOfBirth: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dispute Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Dispute</CardTitle>
              <CardDescription>Add the accounts or items you want to dispute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={item.type}
                      onValueChange={(value: any) => updateItem(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="inquiry">Inquiry</SelectItem>
                        <SelectItem value="public_record">Public Record</SelectItem>
                        <SelectItem value="personal_info">Personal Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="e.g., Capital One Credit Card"
                    />
                  </div>

                  {item.type === 'account' && (
                    <>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={item.accountNumber || ''}
                          onChange={(e) => updateItem(index, 'accountNumber', e.target.value)}
                          placeholder="Last 4 digits: 1234"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Creditor Name</Label>
                        <Input
                          value={item.creditorName || ''}
                          onChange={(e) => updateItem(index, 'creditorName', e.target.value)}
                          placeholder="Capital One"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Reason for Dispute *</Label>
                    <Textarea
                      value={item.reason}
                      onChange={(e) => updateItem(index, 'reason', e.target.value)}
                      placeholder="Explain why this item is inaccurate..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={addItem} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={generateLetter.isPending}
            className="w-full"
            size="lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generateLetter.isPending ? 'Generating...' : 'Generate Dispute Letter'}
          </Button>
        </div>

        {/* Generated Letter Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Generated Letter</CardTitle>
                  <CardDescription>Preview and download your dispute letter</CardDescription>
                </div>
                {generatedLetter && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLetter}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadLetter}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedLetter ? (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedLetter}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Fill in the form and click "Generate Dispute Letter" to create your letter</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
