
"use client";

import { useState } from "react";
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
import { PlusCircle, Calendar as CalendarIcon, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { addBill } from "@/app/actions";
import type { Item, NewBillData } from "@/types";

interface BillItem {
  id: string; // Could be a real item ID or a temporary one for new items
  name: string;
  quantity: number;
  isNew: boolean;
}

interface AddBillDialogProps {
  allItems: Item[];
}

export function AddBillDialog({ allItems }: AddBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [billNumber, setBillNumber] = useState("");
  const [company, setCompany] = useState("");
  const [billDate, setBillDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<number | undefined>();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentItemName, setCurrentItemName] = useState('');
  const [currentItemQty, setCurrentItemQty] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setBillNumber("");
    setCompany("");
    setBillDate(new Date());
    setAmount(undefined);
    setBillItems([]);
    setCurrentItemName('');
    setCurrentItemQty(1);
    setSearchQuery('');
    setLoading(false);
  };

  const handleAddItemToList = () => {
    if (!currentItemName || currentItemQty < 1) {
      toast({ title: "Error", description: "Item name and quantity are required.", variant: "destructive" });
      return;
    }

    const existingItem = allItems.find(i => i.name.toLowerCase() === currentItemName.toLowerCase());
    const newItem: BillItem = existingItem 
        ? { id: existingItem.id, name: existingItem.name, quantity: currentItemQty, isNew: false }
        : { id: `new-item-${Date.now()}`, name: currentItemName, quantity: currentItemQty, isNew: true };
    
    setBillItems(prev => [...prev, newItem]);
    setCurrentItemName('');
    setCurrentItemQty(1);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleRemoveItemFromList = (id: string) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleSelectSearchItem = (item: Item | { id: string; name: string, isNew: boolean }) => {
    setCurrentItemName(item.name);
    setIsSearching(false);
    setSearchQuery('');
  }

  const filteredItems = allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber || !company || !billDate || billItems.length === 0) {
      toast({
        title: "Error",
        description: "Please fill bill details and add at least one item.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    const billData: NewBillData = {
      billNumber,
      company,
      billDate: billDate.toISOString(),
      amount,
      items: billItems
    };

    const result = await addBill(billData);

    if (result.success) {
      toast({ title: "Success!", description: "Bill and items have been added." });
      resetForm();
      setOpen(false);
    } else {
      toast({ title: "Error", description: result.message || "Failed to add bill.", variant: "destructive" });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Bill</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Bill</DialogTitle>
            <DialogDescription>
              Enter the bill details and add the items purchased under this bill.
            </DialogDescription>
          </DialogHeader>
          
          {/* Bill Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill No.</Label>
              <Input id="billNumber" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Optional)</Label>
              <Input id="amount" type="number" value={amount || ''} onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Bill Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !billDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {billDate ? format(billDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={billDate} onSelect={setBillDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
          
          <hr className="my-4"/>

          {/* Items Section */}
          <div>
            <h3 className="text-lg font-medium mb-2">Items on this Bill</h3>
            {billItems.length > 0 && (
                <div className="space-y-2 mb-4">
                    {billItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                            <div>
                                <span className="font-medium">{item.name}</span>
                                {item.isNew && <span className="text-xs text-primary ml-2">(New)</span>}
                                <span className="text-muted-foreground ml-4">Qty: {item.quantity}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItemFromList(item.id)}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 border rounded-md">
              <div className="relative md:col-span-8">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={currentItemName}
                  onChange={(e) => {
                      setCurrentItemName(e.target.value);
                      setSearchQuery(e.target.value);
                      setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  placeholder="Type to search or add new..."
                />
                {isSearching && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <div key={item.id} className="p-2 hover:bg-accent cursor-pointer" onClick={() => handleSelectSearchItem(item)}>
                          {item.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-muted-foreground">No existing items found.</div>
                    )}
                    <div className="p-2 border-t hover:bg-accent cursor-pointer font-medium text-primary" onClick={() => handleSelectSearchItem({id: '', name: searchQuery, isNew: true})}>
                      <PlusCircle className="inline-block mr-2 h-4 w-4" />
                      Add "{searchQuery}" as a new item
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min="1" value={currentItemQty} onChange={e => setCurrentItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </div>
              <div className="md:col-span-2 self-end">
                <Button type="button" onClick={handleAddItemToList} className="w-full">Add Item</Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Bill...' : 'Add Bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
