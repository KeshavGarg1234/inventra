
"use client";

import { useState, type ReactNode, useMemo } from "react";
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
import type { SubItem, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VenetianMask } from "lucide-react";

interface AllotToOtherDialogProps {
  subItem: SubItem;
  onAllot: (subItem: SubItem, userToAssign: User, project?: string) => Promise<void>;
  trigger: ReactNode;
  users: User[];
  isApprovalFlow?: boolean;
}

export function AllotToOtherDialog({ subItem, onAllot, trigger, users = [], isApprovalFlow = false }: AllotToOtherDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [project, setProject] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setSearchQuery("");
    setSelectedUser(null);
    setProject("");
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return users.filter(user => 
      user.personId.toLowerCase().includes(lowercasedQuery) || 
      user.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please search for and select a user to assign the item to.",
        variant: "destructive",
      });
      return;
    }

    await onAllot(subItem, selectedUser, project);
    
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => {
        if (!isOpen) resetForm();
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isApprovalFlow ? "Request Allotment to Other User" : "Allot Item to Other User"}</DialogTitle>
            <DialogDescription>
              Search for an existing user by their ID or name to assign this unit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            {!selectedUser ? (
              <div className="space-y-2">
                <Label htmlFor="searchUser">Search User</Label>
                <Input
                  id="searchUser"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter User ID or Name..."
                  autoComplete="off"
                />
                {searchQuery && (
                  <ScrollArea className="h-40 w-full rounded-md border mt-2">
                    <div className="p-2">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <div
                            key={user.personId}
                            onClick={() => {
                                setSelectedUser(user);
                                setSearchQuery("");
                            }}
                            className="p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                          >
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.personId}</p>
                          </div>
                        ))
                      ) : (
                        <p className="p-2 text-center text-sm text-muted-foreground">
                          User not found. Please add them via the Users page first.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border bg-muted space-y-2">
                <Label>Selected User</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VenetianMask className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{selectedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.personId}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Input
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Optional: Project name"
                disabled={!selectedUser}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!selectedUser}>
              {isApprovalFlow ? "Submit Request" : "Allot Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
