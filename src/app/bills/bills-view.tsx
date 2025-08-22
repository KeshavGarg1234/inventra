
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Bill, Item } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, FileDown, Trash2 } from "lucide-react";
import { AddBillDialog } from "@/components/add-bill-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { deleteBill } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/context/auth-context";

type BillsPageProps = {
  bills: Bill[];
  items: Item[];
  initialSearch: string;
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


export function BillsView({ bills: initialBills, items: initialItems, initialSearch }: BillsPageProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [bills, setBills] = useState(initialBills);
  const [items, setItems] = useState(initialItems);
  const { toast } = useToast();
  const { dbUser } = useAuth();
  const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';

  useEffect(() => {
    const dbRef = ref(db);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            setBills(firebaseObjectToArray<Bill>(data.bills));
            setItems(firebaseObjectToArray<Item>(data.items));
        } else {
            setBills([]);
            setItems([]);
        }
    }, (error) => {
        console.error("Error fetching real-time data:", error);
    });

    return () => unsubscribe();
  }, []);
  
  const getItemsForBill = (billNumber: string) => {
    return items
      .map(item => {
        const quantity = (item.subItems || []).filter(
          si => si.billNumber === billNumber
        ).length;
        return {
          name: item.name,
          quantity: quantity,
        };
      })
      .filter(item => item.quantity > 0);
  };


  const filteredBills = useMemo(() => {
    if (!searchTerm) {
      return bills;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return bills.filter((bill) => {
      const billDateMatch = format(parseISO(bill.billDate), "PPP")
        .toLowerCase()
        .includes(lowercasedTerm);
      
      const itemsInBill = getItemsForBill(bill.billNumber);
      const itemMatch = itemsInBill.some((item) =>
        item.name.toLowerCase().includes(lowercasedTerm)
      );

      const amountMatch = bill.amount?.toString().includes(lowercasedTerm);

      return (
        bill.billNumber.toLowerCase().includes(lowercasedTerm) ||
        bill.company.toLowerCase().includes(lowercasedTerm) ||
        billDateMatch ||
        itemMatch ||
        amountMatch
      );
    });
  }, [bills, items, searchTerm]);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Bill Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on ${format(new Date(), "PPP")}`, 14, 29);

    const tableData = filteredBills.map(bill => {
      const billItems = getItemsForBill(bill.billNumber);
      const itemsString = billItems.map(i => `${i.name} (x${i.quantity})`).join('\n');
      
      return [
        bill.billNumber,
        bill.company,
        format(parseISO(bill.billDate), "PPP"),
        formatCurrency(bill.amount),
        itemsString,
      ];
    });

    (doc as any).autoTable({
      head: [['Bill Number', 'Company', 'Bill Date', 'Amount', 'Items']],
      body: tableData,
      startY: 35,
      headStyles: { fillColor: [41, 128, 185] },
      styles: { cellPadding: 3, fontSize: 9 },
    });

    doc.save(`bill_report_${Date.now()}.pdf`);
  };

  const handleDeleteBill = async (billNumber: string) => {
    const result = await deleteBill(billNumber);
    if (result.success) {
        toast({
            title: "Bill Deleted",
            description: `Bill #${billNumber} and all its units have been removed.`,
        });
        // UI will update automatically from the listener
    } else {
        toast({
            title: "Error",
            description: result.message || "Failed to delete bill.",
            variant: "destructive",
        });
    }
  };


  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bills</h1>
          <p className="text-muted-foreground">
            A list of all purchase bills in the inventory.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={filteredBills.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to PDF
            </Button>
            {canModify && <AddBillDialog allItems={items} />}
        </div>
      </div>

      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Bill Search</CardTitle>
          <CardDescription>
            Search by bill number, company, date, item name or amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            Click on a bill to view its details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <TableRow key={bill.billNumber}>
                    <TableCell className="font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell>{bill.company}</TableCell>
                    <TableCell>
                      {format(parseISO(bill.billDate), "PPP")}
                    </TableCell>
                    <TableCell>{formatCurrency(bill.amount)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/bills/${encodeURIComponent(bill.billNumber)}`} passHref>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {canModify && (
                        <DeleteConfirmationDialog
                          title="Are you absolutely sure?"
                          description={`This action cannot be undone. This will permanently delete bill #${bill.billNumber} and all of its associated units from the inventory, regardless of their status.`}
                          onDelete={() => handleDeleteBill(bill.billNumber)}
                          trigger={
                            <Button variant="destructive" size="sm" aria-label={`Delete bill ${bill.billNumber}`}>
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
                      ? "No bills match your search."
                      : "No bills found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {`Showing ${filteredBills.length} of ${bills.length} bill(s).`}
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
