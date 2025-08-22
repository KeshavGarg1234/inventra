
"use client";

import { useState, type ReactNode } from "react";
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
import type { Item, SubItem, User } from "@/types";

interface SelfAllotRequestDialogProps {
  item: Item;
  subItem: SubItem;
  currentUser: User;
  onAllot: (subItem: SubItem, userToAssign: User, project?: string) => Promise<void>;
  trigger: ReactNode;
}

export function SelfAllotRequestDialog({ item, subItem, currentUser, onAllot, trigger }: SelfAllotRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [project, setProject] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAllot(subItem, currentUser, project);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Request Allotment for Yourself</DialogTitle>
                        <DialogDescription>
                            Confirm you want to request this item. You can optionally add a project name.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <p><strong>Item:</strong> {item.name} ({subItem.id})</p>
                        <p><strong>Requesting User:</strong> {currentUser.name} ({currentUser.personId})</p>
                        <div className="space-y-1 pt-2">
                            <Label htmlFor="project-self">Project (Optional)</Label>
                            <Input
                                id="project-self"
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                                placeholder="Optional: Project name"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Submit Request</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
