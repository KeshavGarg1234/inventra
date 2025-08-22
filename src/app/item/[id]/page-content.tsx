
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, notFound, useSearchParams } from "next/navigation";
import type { Item, SubItem, User, AssignmentDetails } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { allotSubItem, updateItem, deleteItem, deleteSubItem, addUnitsToItem, deleteLot, requestAllotment, requestStatusChange } from '@/app/actions';
import { ItemHeader } from "@/components/item-header";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Archive, PackageCheck, Package, PackageX } from "lucide-react";
import { AddUnitsDialog } from "@/components/add-units-dialog";
import { UnitsTable } from "@/components/units-table";
import { UnitDetailDialog } from "@/components/unit-detail-dialog";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/context/auth-context";

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


export function PageContent({ itemData, users }: { itemData: Item | undefined, users: User[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { dbUser } = useAuth();
    const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';
    
    const [item, setItem] = useState<Item | undefined>(itemData);
    const [scannedUnit, setScannedUnit] = useState<SubItem | null>(null);
    const [isScannedUnitDialogOpen, setIsScannedUnitDialogOpen] = useState(false);


    useEffect(() => {
        // Initial setup from props
        setItem(itemData);

        if (!itemData) return;
        
        // Set up real-time listener for all items in the active inventory
        const itemsRef = ref(db, `items`);
        const unsubscribe = onValue(itemsRef, (snapshot) => {
            if (snapshot.exists()) {
                const allItems = firebaseObjectToArray<Item>(snapshot.val());
                const currentItem = allItems.find(i => i.id === itemData.id);
                if (currentItem) {
                    setItem(currentItem);
                } else {
                    router.push('/inventory');
                }
            } else {
                 router.push('/inventory');
            }
        }, (error) => {
            console.error("Error fetching real-time item data:", error);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();

    }, [itemData, router]);

    useEffect(() => {
        if (item) {
            const unitId = searchParams.get('unitId');
            if (unitId) {
                const unit = (item.subItems || []).find(si => si.id === unitId);
                if (unit) {
                    setScannedUnit(unit);
                    setIsScannedUnitDialogOpen(true);
                } else {
                     toast({
                        title: "Unit Not Found",
                        description: `The scanned unit ID "${unitId}" does not belong to this item.`,
                        variant: "destructive"
                    });
                }
            }
        }
    }, [item, searchParams, toast]);

    if (!item) {
        return notFound();
    }
  
    const handleItemDelete = async () => {
        await deleteItem(item.id);
        toast({
          title: "Item Deleted",
          description: `"${item.name}" has been removed from your inventory.`,
        });
        router.push("/inventory");
    };

    const handleItemUpdate = async (updatedData: Partial<Omit<Item, 'id'>>) => {
        await updateItem(item.id, updatedData);
        // No need for optimistic update here, as the listener will catch the change.
    };

    const handleSubItemDelete = async (subItemIdToDelete: string) => {
        await deleteSubItem(item.id, subItemIdToDelete);
        toast({
          title: "Unit Deleted",
          description: `The unit has been successfully removed.`,
        });
    };
    
    const handleLotDelete = async (lotNameToDelete: string) => {
        await deleteLot(item.id, lotNameToDelete);
        toast({
          title: "Lot Deleted",
          description: `The lot "${lotNameToDelete}" has been successfully removed.`,
        });
    };

    const handleAddUnits = async (data: any) => {
        await addUnitsToItem(data);
         toast({
          title: "Success!",
          description: `${data.quantity} new unit(s) have been added.`,
        });
    };
    
    const handleAllotRequest = async (subItemToAllot: SubItem, userToAssign: User, project?: string) => {
        if (!item) return;

        const assignmentDetails: AssignmentDetails = {
            ...userToAssign,
            assignmentDate: new Date().toISOString(),
            project: project,
        };

        const result = await requestAllotment(item.id, subItemToAllot.id, assignmentDetails);

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


    const handleStatusChangeRequest = async (subItemId: string, type: 'unallot' | 'discard' | 'restore') => {
      if (!item || !dbUser) return;
      const result = await requestStatusChange(item.id, subItemId, type, { personId: dbUser.personId, name: dbUser.name });
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

    const subItems = item.subItems || [];
    const availableCount = subItems.filter(si => si.availabilityStatus === 'Available').length;
    const inUseCount = subItems.filter(si => si.availabilityStatus === 'In Use').length;
    const discardedCount = subItems.filter(si => si.availabilityStatus === 'Discarded').length;

    return (
        <div className="container mx-auto p-4 md:p-8">
            {scannedUnit && (
                <UnitDetailDialog 
                    item={item} 
                    subItem={scannedUnit} 
                    open={isScannedUnitDialogOpen} 
                    onOpenChange={(open) => {
                        if (!open) {
                            router.replace(`/item/${item.id}`, { scroll: false });
                            setScannedUnit(null);
                        }
                    }}
                    users={users}
                    onAllotRequest={handleAllotRequest}
                    onStatusChangeRequest={(type) => handleStatusChangeRequest(scannedUnit.id, type)}
                />
            )}
            
            <ItemHeader item={item} onItemUpdate={handleItemUpdate} onItemDelete={handleItemDelete} />
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="font-headline">Inventory Summary</CardTitle>
                    <CardDescription>Overview of all units for this item.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <Archive className="h-8 w-8 mb-2 text-primary"/>
                        <p className="text-3xl font-bold">{item.totalQuantity}</p>
                        <p className="text-sm text-muted-foreground">Total Units</p>
                    </div>
                     <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <PackageCheck className="h-8 w-8 mb-2 text-green-500"/>
                        <p className="text-3xl font-bold text-green-500">{availableCount}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <Package className="h-8 w-8 mb-2 text-blue-500"/>
                        <p className="text-3xl font-bold text-blue-500">{inUseCount}</p>
                        <p className="text-sm text-muted-foreground">In Use</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <PackageX className="h-8 w-8 mb-2 text-red-500"/>
                        <p className="text-3xl font-bold text-red-500">{discardedCount}</p>
                        <p className="text-sm text-muted-foreground">Discarded</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Individual Units</CardTitle>
                        <CardDescription>A detailed list of all units for this item, grouped by lot.</CardDescription>
                    </div>
                    {canModify && <AddUnitsDialog itemId={item.id} onUnitsAdd={handleAddUnits} />}
                </CardHeader>
                <CardContent>
                   <UnitsTable 
                        item={item}
                        users={users}
                        onSubItemDelete={handleSubItemDelete}
                        onLotDelete={handleLotDelete}
                        onAllotRequest={handleAllotRequest}
                        onStatusChangeRequest={handleStatusChangeRequest}
                   />
                </CardContent>
            </Card>
        </div>
    );
}
