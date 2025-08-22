
"use client";

import React, { useState, useMemo } from 'react';
import type { Item, SubItem, AvailabilityStatus, User, AssignmentDetails } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { QrCodeDisplay } from "@/components/qr-code-display";
import { UnitDetailDialog } from '@/components/unit-detail-dialog';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Circle, Trash2, MoreVertical, QrCode, Info, HandPlatter, UserX, Undo, VenetianMask, User as UserIcon, Phone, Building, Briefcase, Calendar as CalendarIcon, FileDown, BookCopy, UserPlus } from 'lucide-react';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { useAuth } from '@/context/auth-context';
import { SelfAllotRequestDialog } from './self-allot-request-dialog';

interface UnitsTableProps {
    item: Item;
    users: User[];
    onSubItemDelete: (subItemId: string) => Promise<void>;
    onLotDelete: (lotName: string) => Promise<void>;
    onAllotRequest: (subItem: SubItem, userToAssign: User, project?: string) => Promise<void>;
    onStatusChangeRequest: (subItemId: string, type: 'unallot' | 'discard' | 'restore') => Promise<void>;
}

type GroupedSubItems = {
  [lotName: string]: SubItem[];
};

const statusConfig: Record<AvailabilityStatus, { icon: React.ElementType; color: string; label: string }> = {
  Available: { icon: CheckCircle, color: "text-green-500", label: "Available" },
  "In Use": { icon: Circle, color: "text-blue-500", label: "In Use" },
  Discarded: { icon: Trash2, color: "text-red-500", label: "Discarded" },
};

const StatusDisplay = ({ subItem }: { subItem: SubItem }) => {
    const config = statusConfig[subItem.availabilityStatus];
    const isClickable = subItem.availabilityStatus === "In Use" || subItem.availabilityStatus === "Discarded";

    const content = (
    <div className="flex items-center gap-2">
        <config.icon className={cn("h-4 w-4", config.color)} />
        <span>{config.label}</span>
    </div>
    );

    if (!isClickable) {
        return content;
    }

    return (
    <Popover>
        <PopoverTrigger asChild>
        <button className="cursor-pointer">{content}</button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="top" align="start">
        <div className="grid gap-4">
            <div className="space-y-2">
            <h4 className="font-medium leading-none">{subItem.availabilityStatus === "In Use" ? "Assigned To" : "Discarded Details"}</h4>
            <p className="text-sm text-muted-foreground">
                {subItem.availabilityStatus === "In Use" ? "Information about the current user." : "Date the item was discarded."}
            </p>
            </div>
            {subItem.availabilityStatus === 'In Use' && subItem.assignedTo && (
            <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                <VenetianMask className="h-4 w-4 text-muted-foreground" />
                <span>{subItem.assignedTo.personId}</span>
                </div>
                <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>{subItem.assignedTo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{subItem.assignedTo.phone}</span>
                </div>
                {subItem.assignedTo.department && (
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{subItem.assignedTo.department}</span>
                    </div>
                )}
                {subItem.assignedTo.section && (
                    <div className="flex items-center gap-2">
                        <BookCopy className="h-4 w-4 text-muted-foreground" />
                        <span>{subItem.assignedTo.section}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(subItem.assignedTo.assignmentDate), "PPP")}</span>
                </div>
                {subItem.assignedTo.project && (
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{subItem.assignedTo.project}</span>
                    </div>
                )}
            </div>
            )}
            {subItem.availabilityStatus === 'Discarded' && subItem.discardedDate && (
                <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(subItem.discardedDate), "PPP")}</span>
                </div>
            )}
        </div>
        </PopoverContent>
    </Popover>
    );
};

interface UnitDetailTriggerProps {
    item: Item;
    subItem: SubItem;
    users: User[];
    onAllotRequest: (subItem: SubItem, userToAssign: User, project?: string) => Promise<void>;
    onStatusChangeRequest: (type: 'unallot' | 'discard' | 'restore') => Promise<void>;
}

function UnitDetailTrigger({ item, subItem, users, onAllotRequest, onStatusChangeRequest }: UnitDetailTriggerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Info className="h-5 w-5" />
      </Button>
      {open && (
        <UnitDetailDialog
          item={item}
          subItem={subItem}
          open={open}
          onOpenChange={setOpen}
          users={users}
          onAllotRequest={onAllotRequest}
          onStatusChangeRequest={(type) => onStatusChangeRequest(subItem.id, type)}
        />
      )}
    </>
  );
}

export function UnitsTable({ item, users, onSubItemDelete, onLotDelete, onAllotRequest, onStatusChangeRequest }: UnitsTableProps) {
    const qrContainerRef = React.useRef<HTMLDivElement>(null);
    const { dbUser } = useAuth();
    const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';

    const handleAction = async (action: () => Promise<void>) => {
        await action();
    };
    
    const getQrDataForSubItem = (subItem: SubItem): string => {
        return subItem.id;
    };

    const handleDownloadLotQRCodes = (lotName: string, subItemsInLot: SubItem[]) => {
      const doc = new jsPDF();
      const qrSize = 50;
      const margin = 10;
      const gutter = 5;
      const qrsPerRow = 3;
      const pageHeight = doc.internal.pageSize.height;
      let x = margin;
      let y = margin;

      doc.setFontSize(16);
      doc.text(`QR Codes for Lot: ${lotName}`, margin, y);
      y += 15;

      const qrContainer = qrContainerRef.current;
      if (!qrContainer) return;
      
      subItemsInLot.forEach((subItem, index) => {
        if (y + qrSize + 10 > pageHeight) {
          doc.addPage();
          y = margin;
        }

        const canvas = qrContainer.querySelector<HTMLCanvasElement>(`[data-testid="qr-canvas-${subItem.id}"]`);
        
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            doc.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize);
            doc.setFontSize(8);
            doc.text(subItem.id, x + qrSize / 2, y + qrSize + 5, { align: 'center' });
        }


        x += qrSize + gutter;
        if ((index + 1) % qrsPerRow === 0) {
          x = margin;
          y += qrSize + 15;
        }
      });

      doc.save(`lot_${lotName}_qrcodes.pdf`);
    };
    
    const groupedSubItems = useMemo(() => {
        return (item.subItems || []).reduce((acc: GroupedSubItems, subItem: SubItem) => {
            const lotName = subItem.lotName || 'Unassigned';
            if (!acc[lotName]) {
                acc[lotName] = [];
            }
            acc[lotName].push(subItem);
            return acc;
        }, {});
    }, [item.subItems]);
    
    if (!item.subItems || item.subItems.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No individual units have been added for this item yet.
            </div>
        );
    }
    
    return (
      <>
        {/* Hidden container for rendering QR codes for PDF export */}
        <div ref={qrContainerRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            {(item.subItems || []).map(subItem => (
                <QRCodeCanvas 
                    key={subItem.id} 
                    value={subItem.id} 
                    size={256} 
                    level={"H"} 
                    data-testid={`qr-canvas-${subItem.id}`}
                />
            ))}
        </div>

        <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedSubItems)}>
            {Object.entries(groupedSubItems).map(([lotName, subItemsInLot]) => {
                const userRole = dbUser?.role;
                const canAllotToOthers = userRole === 'A';

                 const canUnallotForLot = (subItem: SubItem) => {
                    if (dbUser?.role !== 'D') return true;
                    return subItem.assignedTo?.personId === dbUser?.personId;
                };

                return (
                <AccordionItem value={lotName} key={lotName}>
                    <div className="flex items-center justify-between hover:bg-muted/50 rounded-md transition-colors">
                        <AccordionTrigger className="flex-grow p-4">
                           <div className="flex flex-col md:flex-row md:items-center md:gap-4 text-left">
                                <span className="font-semibold text-lg">{lotName}</span>
                                <div className="text-sm text-muted-foreground flex items-center gap-x-2 flex-wrap">
                                    <span>{subItemsInLot.length} unit(s)</span>
                                    {subItemsInLot[0]?.billNumber && <span className="hidden md:inline">•</span>}
                                    {subItemsInLot[0]?.billNumber && <span>Bill #{subItemsInLot[0].billNumber}</span>}
                                </div>
                           </div>
                        </AccordionTrigger>
                        <div className="pr-4 space-x-2 shrink-0">
                             <Button variant="outline" size="sm" onClick={() => handleDownloadLotQRCodes(lotName, subItemsInLot)}>
                                <FileDown className="mr-2 h-4 w-4"/>
                                Download QRs
                             </Button>
                            {canModify && (
                                <DeleteConfirmationDialog
                                    title="Delete this entire lot?"
                                    description={`This will permanently delete all ${subItemsInLot.length} units in lot "${lotName}". This action cannot be undone.`}
                                    onDelete={() => onLotDelete(lotName)}
                                    trigger={
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            Delete Lot
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                    <AccordionContent>
                        <div className="relative overflow-x-auto border-t">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Unit ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                        <TableHead className="text-right">Info/QR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subItemsInLot.map((subItem) => (
                                    <TableRow key={subItem.id}>
                                        <TableCell className="font-mono text-xs">{subItem.id}</TableCell>
                                        <TableCell>
                                            <StatusDisplay subItem={subItem} />
                                        </TableCell>
                                        <TableCell>
                                        {canModify ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                {subItem.availabilityStatus === 'Available' && dbUser && (
                                                    <>
                                                        <SelfAllotRequestDialog
                                                            item={item}
                                                            subItem={subItem}
                                                            currentUser={dbUser}
                                                            onAllot={(subItem, user, project) => handleAction(() => onAllotRequest(subItem, user, project))}
                                                            trigger={
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                    <HandPlatter className="mr-2 h-4 w-4"/> Request Allotment
                                                                </DropdownMenuItem>
                                                            }
                                                        />
                                                        {canAllotToOthers && (
                                                            <AllotToOtherDialog
                                                                subItem={subItem}
                                                                onAllot={(subItem, user, project) => handleAction(() => onAllotRequest(subItem, user, project))}
                                                                users={users}
                                                                trigger={
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                        <UserPlus className="mr-2 h-4 w-4"/> Allot to Another User
                                                                    </DropdownMenuItem>
                                                                }
                                                                isApprovalFlow={true}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                                {subItem.availabilityStatus === 'In Use' && canUnallotForLot(subItem) && (
                                                    <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <UserX className="mr-2 h-4 w-4"/> Request Unallot
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Unallot this unit?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will submit a request to make the unit available again.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleAction(() => onStatusChangeRequest(subItem.id, 'unallot'))}>Submit Request</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                                    
                                                    {subItem.availabilityStatus === 'Discarded' ? (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                    <Undo className="mr-2 h-4 w-4"/> Request Restore
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Restore this unit?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                    This will submit a request to make the unit available again.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleAction(() => onStatusChangeRequest(subItem.id, 'restore'))}>Submit Request</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    ) : (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={subItem.availabilityStatus === 'In Use'}>
                                                                    <Trash2 className="mr-2 h-4 w-4"/> Request Discard
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Discard this unit?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will submit a request to mark the unit as discarded.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleAction(() => onStatusChangeRequest(subItem.id, 'discard'))}>Submit Request</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    <DeleteConfirmationDialog
                                                    title="Delete this unit?"
                                                    description="This action cannot be undone. This will permanently delete this unit from the inventory."
                                                    onDelete={() => onSubItemDelete(subItem.id)}
                                                    trigger={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-500">
                                                        <Trash2 className="mr-2 h-4 w-4"/> Delete Unit
                                                        </DropdownMenuItem>
                                                    }
                                                    />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : null }
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <UnitDetailTrigger
                                                item={item}
                                                subItem={subItem}
                                                users={users}
                                                onAllotRequest={onAllotRequest}
                                                onStatusChangeRequest={onStatusChangeRequest}
                                            />
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <QrCode className="h-5 w-5" />
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto" side="top" align="end">
                                                <QrCodeDisplay data={getQrDataForSubItem(subItem)} />
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                )
            })}
        </Accordion>
      </>
    );
}
