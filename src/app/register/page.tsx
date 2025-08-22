
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { requestNewUserRegistration } from '@/app/actions';
import { Archive, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const [personId, setPersonId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match.',
      });
      return;
    }
    if (!personId || !name || !email || !phone || !password) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out all required fields.',
        });
        return;
    }
     if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Weak Password',
            description: 'Password should be at least 6 characters.',
        });
        return;
    }

    setIsLoading(true);

    try {
        const response = await requestNewUserRegistration({
            personId,
            name,
            email,
            phone,
            department: department || undefined,
            section: section || undefined,
        });

        if (response.success) {
            // Because we can't create the auth user until approval,
            // we will create it here so they can log in later.
            // In a real-world high-security app, you might use a different method.
            try {
              await createUserWithEmailAndPassword(auth, email, password);
              setShowSuccessDialog(true);
            } catch(authError: any) {
               if (authError.code === 'auth/email-already-in-use') {
                 // This is fine, means they can log in if their DB entry gets approved.
                 setShowSuccessDialog(true);
               } else {
                  toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: authError.message,
                  });
               }
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: response.message || 'An unknown error occurred.',
            });
        }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error submitting request',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  return (
    <>
    <div className="relative flex flex-col items-center justify-center min-h-screen animated-gradient-background p-4 md:p-8 overflow-hidden">
      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Archive className="h-10 w-10 text-primary" />
          <h1 className="text-5xl font-bold font-headline animate-text-shimmer bg-clip-text text-transparent">inventra</h1>
        </div>
        
        <Card className="mt-8 bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Create a New Account</CardTitle>
                <CardDescription>Enter your details to register. Your account will require admin approval.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="personId">Employee ID / Roll No.</Label>
                            <Input id="personId" value={personId} onChange={(e) => setPersonId(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Computer Science" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="section">Class / Section</Label>
                            <Input id="section" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g., Section A" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" value={phone} onChange={handlePhoneChange} required maxLength={10} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="joiningDate">Joining Date</Label>
                            <Input id="joiningDate" value={format(new Date(), 'PPP')} disabled />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                    </div>
                    
                    <Button size="lg" className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? 'Submitting for Approval...' : 'Submit for Approval'}
                    </Button>
                </form>
            </CardContent>
        </Card>

         <div className="mt-4">
             <Button variant="ghost" asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Sign In</Link>
            </Button>
        </div>
      </div>
    </div>
    <Dialog open={showSuccessDialog} onOpenChange={() => router.push('/')}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registration Submitted</DialogTitle>
                <DialogDescription>
                    Your request to join has been sent to the administrators for approval. You will be able to log in once your account has been approved.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => router.push('/')}>OK</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
