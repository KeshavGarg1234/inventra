
"use client";

import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldCheck, Trash2, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateDeletePasskey,
  updateAuthPasskey,
  verifyDeletePasskey,
  verifyAuthPasskey,
  getContactEmail,
  updateContactEmail,
} from "@/app/actions";
import { cn } from "@/lib/utils";


type PasskeyType = "delete" | "auth";
type View = "auth_verify" | "menu" | "change_passkey" | "change_email";

export function SettingsDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>("auth_verify");
  
  const [passkeyToChange, setPasskeyToChange] = useState<PasskeyType | null>(null);
  
  const [authPasskey, setAuthPasskey] = useState("");
  const [currentPasskey, setCurrentPasskey] = useState("");
  const [newPasskey, setNewPasskey] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const passkeyConfig: Record<PasskeyType, { title: string; verifyFn: (passkey: string) => Promise<boolean>; updateFn: (current: string, newP: string) => Promise<any> }> = {
    delete: { title: "Delete Passkey", verifyFn: verifyDeletePasskey, updateFn: updateDeletePasskey },
    auth: { title: "Auth Passkey", verifyFn: verifyAuthPasskey, updateFn: updateAuthPasskey },
  };

  const resetState = () => {
    setCurrentView("auth_verify");
    setPasskeyToChange(null);
    setAuthPasskey("");
    setCurrentPasskey("");
    setNewPasskey("");
    setNewEmail("");
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);
  
  useEffect(() => {
    async function fetchEmail() {
        if(currentView === 'change_email') {
            const email = await getContactEmail();
            setNewEmail(email);
        }
    }
    fetchEmail();
  }, [currentView]);

  const handleAuthVerify = async () => {
    setIsLoading(true);
    const isCorrect = await verifyAuthPasskey(authPasskey);
    if (isCorrect) {
      setCurrentView("menu");
      toast({ title: "Authorized", description: "You can now manage settings." });
    } else {
      toast({ title: "Incorrect Passkey", description: "The Auth Passkey is incorrect.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handlePasskeyToChangeSelect = (type: PasskeyType) => {
    setPasskeyToChange(type);
    setCurrentView("change_passkey");
  }
  
  const handleUpdatePasskey = async () => {
      if (!passkeyToChange) return;
      
      setIsLoading(true);

      const isValidCurrent = await passkeyConfig[passkeyToChange].verifyFn(currentPasskey);
      if (!isValidCurrent) {
          toast({ title: "Incorrect Current Passkey", description: `The current ${passkeyConfig[passkeyToChange].title} is incorrect.`, variant: "destructive" });
          setIsLoading(false);
          return;
      }
      
      if (newPasskey.length !== 6) {
          toast({ title: "Invalid New Passkey", description: "New passkey must be a 6-digit number.", variant: "destructive" });
          setIsLoading(false);
          return;
      }

      const result = await passkeyConfig[passkeyToChange].updateFn(currentPasskey, newPasskey);

      if (result.success) {
          toast({ title: "Passkey Updated", description: `Your ${passkeyConfig[passkeyToChange].title} has been updated.` });
          setOpen(false);
      } else {
          toast({ title: "Update Failed", description: result.message, variant: "destructive" });
      }

      setIsLoading(false);
  }
  
  const handleUpdateEmail = async () => {
      setIsLoading(true);
      const result = await updateContactEmail(newEmail);
      if (result.success) {
          toast({ title: "Contact Email Updated", description: "The contact email has been successfully updated." });
          setOpen(false);
      } else {
          toast({ title: "Update Failed", description: result.message, variant: "destructive" });
      }
      setIsLoading(false);
  }

  const renderAuthVerifyView = () => (
    <>
      <DialogHeader>
        <DialogTitle>Access Settings</DialogTitle>
        <DialogDescription>Enter the Auth Passkey to manage application settings.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="authPasskey">Auth Passkey</Label>
          <Input
            id="authPasskey"
            type="password"
            value={authPasskey}
            onChange={(e) => setAuthPasskey(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit passkey"
            maxLength={6}
            onKeyDown={(e) => e.key === 'Enter' && handleAuthVerify()}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="secondary" disabled={isLoading}>Cancel</Button></DialogClose>
        <Button onClick={handleAuthVerify} disabled={authPasskey.length !== 6 || isLoading}>{isLoading ? "Verifying..." : "Verify"}</Button>
      </DialogFooter>
    </>
  );

  const renderMenuView = () => (
    <>
        <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Select which setting you would like to manage.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
            <Button variant="outline" className="justify-start" onClick={() => handlePasskeyToChangeSelect('delete')}><Trash2 className="mr-2"/> Change Delete Passkey</Button>
            <Button variant="outline" className="justify-start" onClick={() => handlePasskeyToChangeSelect('auth')}><ShieldCheck className="mr-2"/> Change Auth Passkey</Button>
            <Button variant="outline" className="justify-start" onClick={() => setCurrentView('change_email')}><Mail className="mr-2"/> Set Contact Email</Button>
        </div>
        <DialogFooter>
             <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
        </DialogFooter>
    </>
  );

  const renderChangePasskeyView = () => (
      <>
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentView('menu'); setCurrentPasskey(''); setNewPasskey('');}}>
                    <ArrowLeft/>
                </Button>
                Change {passkeyConfig[passkeyToChange!]?.title}
            </DialogTitle>
            <DialogDescription>
                Enter the current and new passkey below.
            </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="currentPasskey">Current Passkey</Label>
                <Input
                id="currentPasskey"
                type="password"
                value={currentPasskey}
                onChange={(e) => setCurrentPasskey(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter current 6-digit passkey"
                maxLength={6}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPasskey">New Passkey</Label>
                <Input
                id="newPasskey"
                type="password"
                value={newPasskey}
                onChange={(e) => setNewPasskey(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter new 6-digit passkey"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdatePasskey()}
                />
            </div>
        </div>
        <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setCurrentView('menu')} disabled={isLoading}>Back to Menu</Button>
            <Button onClick={handleUpdatePasskey} disabled={isLoading || newPasskey.length !== 6 || currentPasskey.length !== 6}>
                {isLoading ? "Saving..." : "Save Changes"}
            </Button>
        </DialogFooter>
      </>
  );

  const renderChangeEmailView = () => (
      <>
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentView('menu'); setNewEmail('');}}>
                    <ArrowLeft/>
                </Button>
                Set Contact Email
            </DialogTitle>
            <DialogDescription>
                This email will be used for the "Contact Us" button on the login page.
            </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="newEmail">Contact Email Address</Label>
                <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g., support@example.com"
                 onKeyDown={(e) => e.key === 'Enter' && handleUpdateEmail()}
                />
            </div>
        </div>
        <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setCurrentView('menu')} disabled={isLoading}>Back to Menu</Button>
            <Button onClick={handleUpdateEmail} disabled={isLoading || !newEmail}>
                {isLoading ? "Saving..." : "Save Email"}
            </Button>
        </DialogFooter>
      </>
  )
  
  const renderContent = () => {
    switch(currentView) {
        case 'auth_verify':
            return renderAuthVerifyView();
        case 'menu':
            return renderMenuView();
        case 'change_passkey':
            return renderChangePasskeyView();
        case 'change_email':
            return renderChangeEmailView();
        default:
            return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={cn("sm:max-w-md", currentView === 'menu' && "sm:max-w-sm")}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
