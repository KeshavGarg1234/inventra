
"use client";

import React, { useState } from 'react';
import type { Item } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Type, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { EditItemDialog } from './edit-item-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { useAuth } from '@/context/auth-context';

interface ItemHeaderProps {
  item: Item;
  onItemUpdate: (updatedData: Partial<Omit<Item, 'id'>>) => Promise<void>;
  onItemDelete: () => Promise<void>;
}

function EditNameDialog({ open, onOpenChange, itemName, onNameChange, handleSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, itemName: string, onNameChange: (name: string) => void, handleSubmit: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <DialogHeader>
            <DialogTitle>Change Name</DialogTitle>
            <DialogDescription>
              Enter a new name for the item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={itemName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., HP Laptop"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ItemHeader({ item, onItemUpdate, onItemDelete }: ItemHeaderProps) {
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [editedName, setEditedName] = useState(item.name);
    const { toast } = useToast();
    const { dbUser } = useAuth();
    const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';

    const handleNameUpdate = async () => {
        if (!editedName) {
            toast({
                title: "Error",
                description: "Item name cannot be empty.",
                variant: "destructive",
            });
            return;
        }
        await onItemUpdate({ name: editedName });
        toast({
            title: "Success!",
            description: "Item name has been updated.",
        });
        setIsEditNameOpen(false);
    };

    return (
        <div className="mb-8">
            <Card className="relative">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-4xl font-bold font-headline">{item.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground mt-2">{item.description}</CardDescription>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setEditedName(item.name); setIsEditNameOpen(true); }}>
                                        <Type className="mr-2 h-4 w-4" /> Change Name
                                    </DropdownMenuItem>
                                    <EditItemDialog item={item} onUpdate={onItemUpdate} trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Edit className="mr-2 h-4 w-4" /> Change Description
                                        </DropdownMenuItem>
                                    }/>
                                    <DropdownMenuSeparator />
                                    <DeleteConfirmationDialog
                                        title="Are you absolutely sure?"
                                        description="This action cannot be undone. This will permanently delete the item and all of its associated data."
                                        onDelete={onItemDelete}
                                        trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-500">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                                            </DropdownMenuItem>
                                        }
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>

            <EditNameDialog 
                open={isEditNameOpen}
                onOpenChange={setIsEditNameOpen}
                itemName={editedName}
                onNameChange={setEditedName}
                handleSubmit={handleNameUpdate}
            />
        </div>
    );
}
