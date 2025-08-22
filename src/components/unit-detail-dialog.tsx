
"use client";

import React, { useState } from 'react';
import type { Item, SubItem, User, AvailabilityStatus, AssignmentDetails } from '@/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { AllotToOtherDialog } from '@/components/allot-to-other-dialog';
import { SelfAllotRequestDialog } from '@/components/self-allot-request-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Circle, Trash2, User as UserIcon, Phone, Building, Briefcase, VenetianMask, Calendar as CalendarIcon, HandPlatter, UserX, Undo, BookCopy } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const statusConfig: Record<AvailabilityStatus, { icon: React.ElementType; color: string; label: string }> = {
  Available: { icon: CheckCircle, color: "text-green-500", label: "Available" },
  "In Use": { icon: Circle, color: "text-blue-500", label: "In Use" },
  Discarded: { icon: Trash2, color: "text-red-500", label: "Discarded" },
};

interface UnitDetailDialogProps {
    item: Item;
    subItem: SubItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: User[];
    onAllotRequest: (subItem: SubItem, userToAssign: User, project?: string) => Promise<void>;
    onStatusChangeRequest: (type: 'unallot' | 'discard' | 'restore') => Promise<void>;
    currentUser?: User | null; // D-level user from secure page
}

const StatusInfo = ({ subItem, isSecureFlow }: { subItem: SubItem, isSecureFlow: boolean }) => {
    if (subItem.availabilityStatus === 'In Use' && subItem.assignedTo) {
        return (
            <div className="grid gap-2 text-sm mt-2">
                <h5 className="font-semibold mt-2 border-t pt-2">Assignment Details</h5>
                <div className="flex items-center gap-2"><VenetianMask className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.personId}</span></div>
                <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.name}</span></div>
                
                {!isSecureFlow && (
                  <>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.phone}</span></div>
                    {subItem.assignedTo.department && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.department}</span></div>}
                    {subItem.assignedTo.section && <div className="flex items-center gap-2"><BookCopy className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.section}</span></div>}
                    {subItem.assignedTo.project && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.project}</span></div>}
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> <span>Assigned on {format(parseISO(subItem.assignedTo.assignmentDate), "PPP")}</span></div>
                  </>
                )}
            </div>
        )
    }
    if (subItem.availabilityStatus === 'Discarded' && subItem.discardedDate) {
        return (
             <div className="grid gap-2 text-sm mt-2">
                <h5 className="font-semibold mt-2 border-t pt-2">Discard Details</h5>
                <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> <span>Discarded on {format(parseISO(subItem.discardedDate), "PPP")}</span></div>
            </div>
        )
    }
    return null;
};

export function UnitDetailDialog({ item, subItem, open, onOpenChange, users, onAllotRequest, onStatusChangeRequest, currentUser = null }: UnitDetailDialogProps) {
    
    const { dbUser: contextDbUser } = useAuth();
    const loggedInUser = currentUser || contextDbUser;
    
    const userRole = loggedInUser?.role;
    const isSecureFlow = userRole === 'D';
    
    const canUnallot = 
      subItem.availabilityStatus === 'In Use' &&
      (
        !isSecureFlow ||
        (isSecureFlow && subItem.assignedTo?.personId === loggedInUser?.personId)
      );
      
    const canModify = loggedInUser?.role === 'A' || loggedInUser?.role === 'B';
    const canAllotToOthers = loggedInUser?.role === 'A';

    const handleAction = async (action: () => Promise<void>) => {
        await action();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unit Details: <span className="font-mono text-lg">{subItem.id}</span></DialogTitle>
                    <DialogDescription>
                        Current information for this specific unit of "{item.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2 min-h-[200px]">
                    <p><strong>Item Name:</strong> {item.name}</p>
                    <p><strong>Bill Number:</strong> {subItem.billNumber || 'N/A'}</p>
                    <div className="flex items-center gap-2">
                        <strong>Status:</strong>
                        <span className={cn("flex items-center gap-1", statusConfig[subItem.availabilityStatus].color)}>
                           {React.createElement(statusConfig[subItem.availabilityStatus].icon, { className: "h-4 w-4" })}
                           {statusConfig[subItem.availabilityStatus].label}
                        </span>
                    </div>
                    <StatusInfo subItem={subItem} isSecureFlow={isSecureFlow} />
                </div>
                <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                    </DialogClose>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
                        {subItem.availabilityStatus === 'Available' && loggedInUser && (
                            <>
                                {(canModify || isSecureFlow) && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full sm:w-auto"><Trash2 className="mr-2 h-4 w-4"/> Request Discard</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Discard this unit?</AlertDialogTitle>
                                                <AlertDialogDescription>This will submit a request to mark the unit as discarded.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleAction(() => onStatusChangeRequest('discard'))}>Submit Request</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                 )}
                                <div className='flex flex-col gap-2'>
                                    {canAllotToOthers && (
                                        <AllotToOtherDialog
                                            subItem={subItem}
                                            onAllot={(subItem, user, project) => handleAction(() => onAllotRequest(subItem, user, project))}
                                            users={users}
                                            trigger={<Button variant="secondary" className="w-full sm:w-auto">Allot to Another User</Button>}
                                            isApprovalFlow={true}
                                        />
                                    )}
                                    <SelfAllotRequestDialog
                                        item={item}
                                        subItem={subItem}
                                        currentUser={loggedInUser}
                                        onAllot={(subItem, user, project) => handleAction(() => onAllotRequest(subItem, user, project))}
                                        trigger={<Button className="w-full sm:w-auto"><HandPlatter className="mr-2 h-4 w-4"/> Request Allotment</Button>}
                                    />
                                </div>
                            </>
                        )}

                        {canUnallot && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full sm:w-auto"><UserX className="mr-2 h-4 w-4"/> Request Unallot</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Unallot this unit?</AlertDialogTitle>
                                        <AlertDialogDescription>This will submit a request to make the unit available again.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleAction(() => onStatusChangeRequest('unallot'))}>Submit Request</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {subItem.availabilityStatus === 'Discarded' && (canModify || isSecureFlow) && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full sm:w-auto"><Undo className="mr-2 h-4 w-4"/> Request Restore</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Restore this unit?</AlertDialogTitle>
                                        <AlertDialogDescription>This will submit a request to make the unit available again.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleAction(() => onStatusChangeRequest('restore'))}>Submit Request</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
