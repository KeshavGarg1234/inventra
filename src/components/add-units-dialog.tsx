
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
import { PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import type { AddUnitsData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AddUnitsDialogProps {
  itemId: string,
  onUnitsAdd: (data: AddUnitsData) => Promise<void>
}

export function AddUnitsDialog({ itemId, onUnitsAdd }: AddUnitsDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [billNumber, setBillNumber] = useState("");
  const [lotName, setLotName] = useState("");
  const [company, setCompany] = useState("");
  const [billDate, setBillDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setQuantity(1);
    setBillNumber("");
    setLotName("");
    setCompany("");
    setBillDate(new Date());
    setAmount(undefined);
    setLoading(false);
  }

  const handleBillNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBillNumber(value);
    // Auto-fill lot name with bill number if lot name is empty
    if (!lotName) {
      setLotName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || !billNumber || !billDate || !company || !lotName) {
      toast({
        title: "Error",
        description: "Please fill all fields: Quantity, Bill Number, Lot Name, Bill Date, and Company.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
        await onUnitsAdd({
            itemId,
            quantity,
            billNumber,
            company,
            billDate: billDate.toISOString(),
            amount,
            lotName,
        });
        
        resetForm();
        setOpen(false);
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error adding units",
            description: "Something went wrong. Please try again.",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setOpen(isOpen); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add More Units
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add More Units</DialogTitle>
            <DialogDescription>Add new units to this item by providing the purchase details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="billNumber" className="text-right">Bill No.</Label>
              <Input
                id="billNumber"
                value={billNumber}
                onChange={handleBillNumberChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lotName" className="text-right">Lot Name</Label>
              <Input
                id="lotName"
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                className="col-span-3"
                placeholder="Defaults to Bill No."
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Bill Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="col-span-3"
                placeholder="Optional: e.g. 1250.50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Bill Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !billDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {billDate ? format(billDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={billDate}
                    onSelect={setBillDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Units'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
