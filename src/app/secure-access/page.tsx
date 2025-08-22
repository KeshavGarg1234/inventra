
'use client';

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScannerDialog } from '@/components/scanner-dialog';
import { UnitDetailDialog } from '@/components/unit-detail-dialog';
import { LogOut, ScanLine, Archive } from 'lucide-react';
import type { Item, SubItem, User } from '@/types';
import { requestAllotment, requestStatusChange } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';


export default function SecureAccessPage() {
    const { user, dbUser, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannedData, setScannedData] = useState<{ item: Item, subItem: SubItem } | null>(null);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/');
    };
    
    const handleScanSuccess = (item: Item, subItem: SubItem) => {
        setScannedData({ item, subItem });
    };

    const handleDialogClose = () => {
        setScannedData(null);
    };

    const handleAllotRequest = async (subItemToAllot: SubItem, userToAssign: User, project?: string) => {
        if (!scannedData || !dbUser) return; // Ensure dbUser is available
        const result = await requestAllotment(scannedData.item.id, subItemToAllot.id, {
            ...dbUser, // Use the currently logged in E-level user
            assignmentDate: new Date().toISOString(),
            project,
        });
        if (result.success) {
            toast({ title: 'Request Submitted', description: result.message });
        } else {
            toast({ title: 'Request Failed', description: result.message, variant: 'destructive' });
        }
        handleDialogClose();
    };

    const handleStatusChangeRequest = async (type: 'unallot' | 'discard' | 'restore') => {
        if (!scannedData) return;
        const result = await requestStatusChange(scannedData.item.id, scannedData.subItem.id, type);
        if (result.success) {
            toast({ title: 'Request Submitted', description: result.message });
        } else {
            toast({ title: 'Request Failed', description: result.message, variant: 'destructive' });
        }
        handleDialogClose();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }
    
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen animated-gradient-background p-4">
             <div className="absolute top-4 right-4 flex items-center gap-2">
                <ThemeToggle />
                <Button
                    variant="ghost"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>


            <Card className="w-full max-w-sm text-center bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                         <Archive className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Secure Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                      <p className="text-xl font-medium">Welcome, {dbUser?.name || user?.displayName || 'User'}</p>
                      <p className="text-sm text-muted-foreground mt-1">You can now scan items.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => setIsScannerOpen(true)}
                    >
                        <ScanLine className="mr-2 h-5 w-5" />
                        Scan Unit
                    </Button>
                </CardFooter>
            </Card>

            <ScannerDialog
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                fromSecurePage={true}
                onSecureScanSuccess={handleScanSuccess}
            />

            {scannedData && dbUser && (
                 <UnitDetailDialog
                    item={scannedData.item}
                    subItem={scannedData.subItem}
                    open={!!scannedData}
                    onOpenChange={(open) => { if (!open) handleDialogClose(); }}
                    users={[]} // Not needed for D-level users
                    onAllotRequest={handleAllotRequest}
                    onStatusChangeRequest={handleStatusChangeRequest}
                    currentUser={dbUser} // Pass the current D-level user
                />
            )}
        </div>
    );
}
