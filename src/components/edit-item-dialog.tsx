
"use client";

import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Item } from "@/types";

interface EditItemDialogProps {
  item: Item;
  onUpdate: (updatedData: { description: string }) => Promise<void>;
  trigger: React.ReactNode;
}

export function EditItemDialog({ item, onUpdate, trigger }: EditItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(item.description);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(item.description);
    }
  }, [open, item.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      toast({
        title: "Error",
        description: "Description cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    await onUpdate({ description });
    toast({
      title: "Success!",
      description: "Item description has been updated.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>
              Update the description for "{item.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="description" className="sr-only">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 min-h-[120px]"
              placeholder="Item details and specifications"
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
