
"use client";

import { useState, useEffect } from "react";
import type { Item, Bill, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, PackageCheck, Package, PackageX, FileText, Users, Cog } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";

type DashboardViewProps = {
    items: Item[];
    bills: Bill[];
    users: User[];
}

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


export function DashboardView({ items: initialItems, bills: initialBills, users: initialUsers }: DashboardViewProps) {
    const [items, setItems] = useState(initialItems);
    const [bills, setBills] = useState(initialBills);
    const [users, setUsers] = useState(initialUsers);

    useEffect(() => {
        const dbRef = ref(db);
        
        const unsubscribe = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setItems(firebaseObjectToArray<Item>(data.items));
                setBills(firebaseObjectToArray<Bill>(data.bills));
                setUsers(firebaseObjectToArray<User>(data.users));
            } else {
                setItems([]);
                setBills([]);
                setUsers([]);
            }
        }, (error) => {
            console.error("Error fetching real-time data:", error);
        });

        return () => unsubscribe();
    }, []);

    const availableCount = items.reduce((sum, item) => sum + (item.subItems || []).filter(si => si.availabilityStatus === 'Available').length, 0);
    const inUseCount = items.reduce((sum, item) => sum + (item.subItems || []).filter(si => si.availabilityStatus === 'In Use').length, 0);
    const discardedCount = items.reduce((sum, item) => sum + (item.subItems || []).filter(si => si.availabilityStatus === 'Discarded').length, 0);
    const totalUnits = availableCount + inUseCount + discardedCount;
    
    const chartData = items.map(item => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
        total: item.totalQuantity,
        Available: (item.subItems || []).filter(si => si.availabilityStatus === 'Available').length,
        "In Use": (item.subItems || []).filter(si => si.availabilityStatus === 'In Use').length,
    }));

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                    <p className="text-muted-foreground">Real-time inventory tracking and management system</p>
                </div>
                <SettingsDialog trigger={
                    <Button variant="outline">
                        <Cog className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                }/>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUnits}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <PackageCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{availableCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Use</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{inUseCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Discarded</CardTitle>
                        <PackageX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{discardedCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bills.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Item Distribution</CardTitle>
                    <p className="text-sm text-muted-foreground">Availability status for each item type.</p>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '1rem'}}/>
                            <Bar dataKey="Available" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                             <Bar dataKey="In Use" stackId="a" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>
    );
}
