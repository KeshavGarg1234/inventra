
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { verifyDeletePasskey } from "@/app/actions";

interface DeleteConfirmationDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onDelete: () => Promise<void>;
}

export function DeleteConfirmationDialog({
  trigger,
  title,
  description,
  onDelete,
}: DeleteConfirmationDialogProps) {
  const [open, setOpen] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!passkey) {
      toast({
        title: "Passkey Required",
        description: "Please enter the delete passkey.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const isCorrect = await verifyDeletePasskey(passkey);

    if (isCorrect) {
      await onDelete();
      setOpen(false); // Close dialog on success
    } else {
      toast({
        title: "Incorrect Passkey",
        description: "The delete passkey you entered is incorrect.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
    setPasskey(""); // Clear passkey after attempt
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="delete-passkey">Delete Passkey</Label>
          <Input
            id="delete-passkey"
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="Enter 6-digit delete passkey"
            maxLength={6}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This action is permanent. Enter the delete passkey to confirm.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isLoading || !passkey}>
            {isLoading ? "Deleting..." : "Confirm & Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
