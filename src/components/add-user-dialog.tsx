
"use client";

import { useState } from "react";
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
import { PlusCircle } from "lucide-react";
import type { NewUserData, ActionResponse, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { addUserAsAdmin } from "@/app/actions";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setPersonId("");
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setSection("");
    setPassword("");
    setLoading(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !name || !phone || !email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields including password are required.",
      });
      return;
    }

    if (phone.length !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits.",
      });
      return;
    }

    setLoading(true);

    try {
       // First, try to create the Firebase Auth user
      await createUserWithEmailAndPassword(auth, email, password);

      // If auth creation is successful, add the user to the database
      const newUserData: NewUserData = {
        personId,
        name,
        email,
        phone,
        department: department || undefined,
        section: section || undefined,
      };

      const result = await addUserAsAdmin(newUserData);

      if (result && result.success) {
        toast({
          title: "Success!",
          description: `User "${name}" has been added and their login has been created.`,
        });
        resetForm();
        setOpen(false);
      } else {
        // This part is a failsafe. If DB write fails, we should ideally delete the auth user.
        // For simplicity, we'll just show an error. The user can be manually deleted from Firebase console.
        toast({
          variant: "destructive",
          title: "Database Error",
          description: result.message || "Could not save user data after creating login.",
        });
      }
    } catch (error: any) {
      let errorMessage = "Something went wrong. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered for login. Please use a different email.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      }
      toast({
        variant: "destructive",
        title: "Error adding user",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter the details for a new user. This will create their database entry and a login account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="personId">Person ID</Label>
              <Input
                id="personId"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                placeholder="e.g., EMP-001 or Student ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="10-digit phone number"
                maxLength={10}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Optional: e.g., Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Optional: e.g., Section A"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
