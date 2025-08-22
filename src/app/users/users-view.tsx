
"use client";

import { useState, useMemo, useEffect } from "react";
import type { User, Item } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, Trash2, FileDown } from "lucide-react";
import { deleteUser } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { AddUserDialog } from "@/components/add-user-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/context/auth-context";

type UsersPageProps = {
  users: User[];
  items: Item[];
};

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


export function UsersView({ users: initialUsers, items: initialItems }: UsersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [items, setItems] = useState(initialItems);
  const { toast } = useToast();
  const { dbUser } = useAuth();
  const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';

  useEffect(() => {
    const dbRef = ref(db);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            setUsers(firebaseObjectToArray<User>(data.users));
            setItems(firebaseObjectToArray<Item>(data.items));
        } else {
            setUsers([]);
            setItems([]);
        }
    }, (error) => {
        console.error("Error fetching real-time data:", error);
    });

    return () => unsubscribe();
  }, []);

  const getAllottedItemCount = (personId: string) => {
    return items.reduce((total, item) => {
      const count = (item.subItems || []).filter(
        (si) => si.assignedTo?.personId === personId
      ).length;
      return total + count;
    }, 0);
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(lowercasedTerm) ||
        user.personId.toLowerCase().includes(lowercasedTerm) ||
        user.department?.toLowerCase().includes(lowercasedTerm) ||
        user.section?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [users, searchTerm]);

  const handleDeleteUser = async (userToDelete: User) => {
    const result = await deleteUser(userToDelete.personId);
    if (result.success) {
      toast({
        title: "User Deleted",
        description: `User ${userToDelete.name} has been deleted.`,
      });
      // UI will update automatically from the listener
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("User Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on ${format(new Date(), "PPP")}`, 14, 29);

    const tableData = filteredUsers.map(user => {
      return [
        user.personId,
        user.name,
        user.phone,
        user.department || 'N/A',
        user.section || 'N/A',
        getAllottedItemCount(user.personId),
        format(parseISO(user.joiningDate), "PPP"),
      ];
    });

    (doc as any).autoTable({
      head: [['Person ID', 'Name', 'Phone', 'Department', 'Section', 'Items Allotted', 'Joining Date']],
      body: tableData,
      startY: 35,
      headStyles: { fillColor: [41, 128, 185] },
      styles: { cellPadding: 3, fontSize: 8 },
    });

    doc.save(`user_report_${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Users</h1>
          <p className="text-muted-foreground">
            A list of all users with allotted inventory items.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={filteredUsers.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
          {canModify && <AddUserDialog />}
        </div>
      </div>

      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">User Search</CardTitle>
          <CardDescription>
            Search by name, person ID, department, or section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Click on a user to view their details and allotted items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Items Allotted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.personId}>
                    <TableCell className="font-medium">{user.personId}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.department || 'N/A'}</TableCell>
                    <TableCell>{getAllottedItemCount(user.personId)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/users/${encodeURIComponent(user.personId)}`} passHref>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {canModify && (
                        <DeleteConfirmationDialog
                            title="Are you absolutely sure?"
                            description={`This action cannot be undone. This will permanently delete the user '${user.name}'. Any items currently assigned to them will be marked as 'Available'.`}
                            onDelete={() => handleDeleteUser(user)}
                            trigger={
                            <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground h-24"
                  >
                    {searchTerm
                      ? "No users match your search."
                      : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {`Showing ${filteredUsers.length} of ${users.length} user(s).`}
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
