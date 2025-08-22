
"use client";

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import type { User, Item, SubItem, AssignmentDetails, UserRole, ActionResponse } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Edit, Building, VenetianMask, Trash2, BookCopy, Shield, Mail } from 'lucide-react';
import { updateUser, deleteUser, requestAllotment, requestStatusChange, verifyAuthPasskey } from '@/app/actions';
import { UnitDetailDialog } from '@/components/unit-detail-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { db } from '@/lib/firebase/config';
import { ref, onValue } from 'firebase/database';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';


// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


type AllottedItemInfo = {
    parentItem: Item;
    subItem: SubItem;
}

const userRoles: UserRole[] = ['A', 'B', 'C', 'D'];

function EditUserDialog({ user, onUpdate, currentUserRole }: { user: User, onUpdate: (originalPersonId: string, updatedUser: User) => Promise<ActionResponse>, currentUserRole?: UserRole }) {
  const [open, setOpen] = useState(false);
  const [isPasskeyAlertOpen, setIsPasskeyAlertOpen] = useState(false);
  const [authPasskey, setAuthPasskey] = useState("");
  const [personId, setPersonId] = useState(user.personId);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [department, setDepartment] = useState(user.department || "");
  const [section, setSection] = useState(user.section || "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsLoading(true);
    const result = await onUpdate(user.personId, {
      ...user,
      personId,
      name,
      email,
      phone,
      department: department || undefined,
      section: section || undefined,
      role,
    });

    if (result.success) {
      toast({
        title: "Success!",
        description: `User ${user.name} has been updated.`,
      });
      setOpen(false);
      setIsPasskeyAlertOpen(false);
    } else {
        toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
        });
    }
    setIsLoading(false);
    setAuthPasskey("");
  }
  
  const handlePasskeyConfirm = async () => {
    setIsLoading(true);
    const isCorrect = await verifyAuthPasskey(authPasskey);
    if (isCorrect) {
      await handleUpdate();
    } else {
      toast({
        title: "Incorrect Passkey",
        description: "The Auth Passkey is incorrect.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !name || !phone || !email) {
      toast({ title: "Error", description: "Person ID, Name, Email and phone number are required.", variant: "destructive" });
      return;
    }
    if (phone.length !== 10) {
       toast({ title: "Invalid Phone Number", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
      return;
    }

    // If role has been changed by an admin, prompt for passkey
    if (currentUserRole === 'A' && role !== user.role) {
        setIsPasskeyAlertOpen(true);
    } else {
        await handleUpdate();
    }
  };
  
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  useEffect(() => {
      if (open) {
          setPersonId(user.personId);
          setName(user.name);
          setEmail(user.email);
          setPhone(user.phone);
          setDepartment(user.department || "");
          setSection(user.section || "");
          setRole(user.role);
          setAuthPasskey("");
          setIsLoading(false);
      }
  }, [open, user]);

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>Update the information for {user.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="personId" className="text-right">Person ID</Label>
              <Input
                id="personId"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                disabled // Cannot change email as it's linked to auth
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section" className="text-right">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="col-span-3"
              />
            </div>
            {currentUserRole === 'A' && (
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Access Level</Label>
                  <div className="col-span-3 flex gap-1">
                      {userRoles.map(r => (
                          <Button
                              type="button"
                              key={r}
                              variant={role === r ? 'secondary' : 'outline'}
                              onClick={() => setRole(r)}
                              className={cn("w-full", role === r && "ring-2 ring-primary")}
                              disabled={user.role === 'A' && r !== 'A'} // Prevent demoting the root admin
                          >
                              {r}
                          </Button>
                      ))}
                  </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isPasskeyAlertOpen} onOpenChange={setIsPasskeyAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Admin Authorization Required</AlertDialogTitle>
                <AlertDialogDescription>
                    Changing a user's access level is a sensitive action. Please enter the Auth Passkey to confirm.
                </AlertDialogDescription>
            </AlertDialogHeader>
             <div className="py-2">
                <Label htmlFor="auth-passkey-change">Auth Passkey</Label>
                <Input
                    id="auth-passkey-change"
                    type="password"
                    value={authPasskey}
                    onChange={(e) => setAuthPasskey(e.target.value)}
                    placeholder="Enter 6-digit auth passkey"
                    maxLength={6}
                    className="mt-2"
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <Button onClick={handlePasskeyConfirm} disabled={isLoading || authPasskey.length !== 6}>
                    {isLoading ? "Verifying..." : "Confirm & Save"}
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

type UserDetailPageProps = {
    user: User | undefined;
    items: Item[];
};

export function UserDetailView({ user: initialUser, items: initialItems }: UserDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { dbUser } = useAuth();
  const [user, setUser] = useState(initialUser);
  const [items, setItems] = useState(initialItems);
  const [selectedUnit, setSelectedUnit] = useState<AllottedItemInfo | null>(null);
  const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';

  useEffect(() => {
    setUser(initialUser);
    setItems(initialItems);
  }, [initialUser, initialItems]);
  
  useEffect(() => {
    if (!initialUser) return;
    
    const dbRef = ref(db);
    const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const allUsers = firebaseObjectToArray<User>(data.users);
            const allItems = firebaseObjectToArray<Item>(data.items);

            const currentUser = allUsers.find(u => u.personId === user?.personId);
            
            if (currentUser) {
                setUser(currentUser);
                setItems(allItems);
            } else {
                toast({
                    title: "User Deleted",
                    description: "This user has been removed.",
                    variant: "destructive"
                });
                router.push('/users');
            }
        } else {
            router.push('/users');
        }
    });

    return () => unsubscribe();
}, [initialUser, user?.personId, router, toast]);

  if (!user) {
    notFound();
  }

  const allottedItems: AllottedItemInfo[] = [];
  items.forEach(item => {
    (item.subItems || []).forEach(subItem => {
      if (subItem.assignedTo?.personId === user.personId) {
        allottedItems.push({
          parentItem: item,
          subItem: subItem,
        });
      }
    });
  });

  const handleUpdateUser = async (originalPersonId: string, updatedUserData: User) => {
    const result = await updateUser(originalPersonId, updatedUserData);
    if (result.success && originalPersonId !== updatedUserData.personId) {
      router.replace(`/users/${encodeURIComponent(updatedUserData.personId)}`);
    }
    return result;
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    const result = await deleteUser(user.personId);
    if (result.success) {
      toast({
        title: "User Deleted",
        description: `User ${user.name} has been deleted.`,
      });
      router.push('/users');
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };
  
    const handleAllotRequest = async (subItemToAllot: SubItem, userToAssign: User, project?: string) => {
        if (!selectedUnit) return;

        const assignmentDetails: AssignmentDetails = {
            ...userToAssign,
            assignmentDate: new Date().toISOString(),
            project: project,
        };
        
        const result = await requestAllotment(selectedUnit.parentItem.id, subItemToAllot.id, assignmentDetails);

        if (result.success) {
            toast({
                title: "Request Submitted",
                description: result.message
            });
        } else {
            toast({
                title: "Request Failed",
                description: result.message,
                variant: "destructive"
            });
        }
    };

  const handleStatusChangeRequest = async (type: 'unallot' | 'discard' | 'restore') => {
    if (!selectedUnit) return;
    const { parentItem, subItem } = selectedUnit;
    const result = await requestStatusChange(parentItem.id, subItem.id, type);
    if(result.success) {
      toast({
        title: "Request Submitted",
        description: result.message
      });
    } else {
       toast({
        title: "Request Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };


  const allottedItemCount = allottedItems.length;

  return (
    <div className="container mx-auto p-4 md:p-8">
      {selectedUnit && (
        <UnitDetailDialog 
          item={selectedUnit.parentItem}
          subItem={selectedUnit.subItem}
          open={!!selectedUnit}
          onOpenChange={(open) => {
            if (!open) setSelectedUnit(null);
          }}
          users={items.flatMap(i => (i.subItems || []).map(s => s.assignedTo)).filter(Boolean) as User[]}
          onAllotRequest={handleAllotRequest}
          onStatusChangeRequest={handleStatusChangeRequest}
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">User Details</h1>
          <p className="text-muted-foreground">Information for {user.name}</p>
        </div>
        {canModify && (
            <div className="flex gap-2">
            <EditUserDialog user={user} onUpdate={handleUpdateUser} currentUserRole={dbUser?.role} />
            <DeleteConfirmationDialog
                title="Are you absolutely sure?"
                description={`This action cannot be undone. This will permanently delete the user '${user.name}'. ${allottedItemCount > 0 ? `Any of the ${allottedItemCount} item(s) currently assigned to them will be marked as 'Available'.` : ''}`}
                onDelete={handleDeleteUser}
                trigger={
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                </Button>
                }
            />
            </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Person ID</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center gap-2">
              <VenetianMask className="h-6 w-6" /> {user.personId}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Name</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{user.name}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Email Address</CardTitle>
            <CardDescription className="text-xl font-bold text-foreground break-all flex items-center gap-2">
                <Mail className="h-6 w-6"/> {user.email}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Phone Number</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{user.phone}</CardDescription>
          </CardHeader>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Department</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building className="h-6 w-6" /> {user.department || 'N/A'}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Section</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookCopy className="h-6 w-6" /> {user.section || 'N/A'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
       <div className="grid md:grid-cols-2 gap-6 mb-8">
         <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Joining Date</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{format(parseISO(user.joiningDate), 'PPP')}</CardDescription>
          </CardHeader>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Access Level</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6" /> Level {user.role}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Allotted Items</CardTitle>
          <CardDescription>A list of all inventory items currently assigned to this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Unit ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allottedItems.map(allotted => (
                <TableRow key={allotted.subItem.id}>
                  <TableCell className="font-medium">{allotted.parentItem.name}</TableCell>
                  <TableCell className="font-mono text-xs">{allotted.subItem.id}</TableCell>
                  <TableCell>{allotted.subItem.assignedTo?.project || 'N/A'}</TableCell>
                  <TableCell>{format(parseISO(allotted.subItem.assignedTo!.assignmentDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUnit(allotted)}>
                      View Unit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {allottedItems.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        No items have been allotted to this user.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    