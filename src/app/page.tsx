
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Archive, ArrowRight, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { getContactEmail } from '@/app/actions';

function ContactEmailDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [contactEmail, setContactEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setContactEmail(null);
            getContactEmail().then(email => {
                setContactEmail(email);
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" title="Contact Us">
                    <Mail />
                    <span className="sr-only">Contact Us</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contact Us</DialogTitle>
                    <DialogDescription>
                       For any queries, feedback, or other projects, please reach out to our team.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading && <p className="text-center">Loading contact information...</p>}
                    {contactEmail && !isLoading && (
                         <div className="flex flex-col items-center justify-center text-center space-y-4">
                           <div className="w-full space-y-1">
                               <p className="text-sm text-muted-foreground">Email Address</p>
                               <p className="text-lg font-semibold break-all">{contactEmail}</p>
                           </div>
                           <div className="w-full space-y-1 pt-4 border-t">
                               <p className="text-sm text-muted-foreground">Team</p>
                               <p className="text-lg font-semibold">inventra-fzobb</p>
                           </div>
                         </div>
                    )}
                     {(!contactEmail && !isLoading) && <p className="text-center text-muted-foreground">Contact email has not been set by the administrator.</p>}
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button>Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ForgotPasswordDialog() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
      setOpen(false); // Close dialog on success
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send reset email. Please ensure the email address is correct and registered.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
        >
          Forgot Password?
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handlePasswordReset}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we will send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Success', description: 'Logged in successfully.' });
      router.push('/dashboard'); // Redirect to dashboard
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error signing in',
        description: 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen animated-gradient-background p-4 md:p-8 overflow-hidden">
       <div className="absolute top-4 right-4 flex items-center gap-2">
          <ContactEmailDialog />
          <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-sm text-center">
         <div className="flex items-center justify-center gap-2 mb-4">
            <Archive className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold font-headline animate-text-shimmer bg-clip-text text-transparent">inventra</h1>
        </div>
        
        <form onSubmit={handleSignIn} className="space-y-4 bg-card/80 backdrop-blur-sm p-6 rounded-lg border shadow-sm mt-8">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Welcome Back</h2>
                <p className="text-sm text-muted-foreground">Enter your credentials to access your inventory</p>
            </div>
            <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    required
                />
            </div>
             <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <ForgotPasswordDialog />
                </div>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                />
            </div>
            <Button size="lg" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
             <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/80 px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
             <Button size="lg" variant="secondary" className="w-full" asChild>
                <Link href="/register">Register a new user</Link>
            </Button>
        </form>
      </div>
    </div>
  );
}
