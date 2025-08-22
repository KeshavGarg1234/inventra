
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Item, NewItemData, ActionResponse } from "@/types";
import { AddItemDialog } from "@/components/add-item-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search } from "lucide-react";
import { addItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
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


export function InventoryView({ items: initialItems }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(initialItems);
  const { dbUser } = useAuth();
  const canModify = dbUser?.role === 'A' || dbUser?.role === 'B';

  useEffect(() => {
    const itemsRef = ref(db, `items`);
    
    const unsubscribe = onValue(itemsRef, (snapshot) => {
        if (snapshot.exists()) {
            const itemsData = firebaseObjectToArray<Item>(snapshot.val());
            setItems(itemsData);
        } else {
            setItems([]);
        }
    }, (error) => {
        console.error("Error fetching real-time items:", error);
    });

    return () => {
        unsubscribe();
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return items;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return items.filter((item) => {
      const subItems = item.subItems || [];
      
      const nameMatch = item.name.toLowerCase().includes(lowercasedTerm);
      const descriptionMatch = item.description.toLowerCase().includes(lowercasedTerm);

      const subItemMatch = subItems.some((subItem) =>
        subItem.id.toLowerCase().includes(lowercasedTerm) ||
        (subItem.lotName && subItem.lotName.toLowerCase().includes(lowercasedTerm)) ||
        subItem.availabilityStatus.toLowerCase().includes(lowercasedTerm)
      );
      
      return nameMatch || descriptionMatch || subItemMatch;
    });
  }, [items, searchTerm]);
  
  const handleAddItem = async (item: NewItemData): Promise<ActionResponse | void> => {
    return await addItem(item);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Inventory</h1>
          <p className="text-muted-foreground">
            A complete list of all items in your inventory.
          </p>
        </div>
        {canModify && <AddItemDialog onAddItem={handleAddItem} />}
      </div>

      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Inventory Search</CardTitle>
          <CardDescription>
            Search by name, description, status, unit ID, or lot name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, status, unit ID, lot name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const subItems = item.subItems || [];
            const availableCount = subItems.filter(
              (si) => si.availabilityStatus === "Available"
            ).length;
            const totalQuantity = subItems.length;

            return (
              <Card key={item.id} className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-card">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2 h-10">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-bold text-foreground">{totalQuantity}</span> total units
                    </p>
                    <p>
                      <span className="font-bold text-green-500">{availableCount}</span> available
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/item/${item.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Items Found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? 'Try adjusting your search term.' : 'Click "Add New Item" to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
