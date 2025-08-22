
import { getData } from '@/app/actions';
import { notFound } from 'next/navigation';
import { PageContent } from "./page-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import AuthenticatedLayout from '@/components/authenticated-layout';

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
    try {
        const { items, users } = await getData();
        const item = items.find((i) => i.id === params.id);
        
        if (!item) {
            notFound();
        }

        return (
          <AuthenticatedLayout>
            <PageContent itemData={item} users={users} />
          </AuthenticatedLayout>
        );
    } catch (error: any) {
        console.error(error);
        const errorMessage = error.message || "An unknown error occurred.";
        return (
          <AuthenticatedLayout>
            <div className="container mx-auto p-4 md:p-8">
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Failed to Load Item Details</AlertTitle>
                <AlertDescription>
                    <p>There was a problem connecting to the database. This might be a temporary issue with your connection or the database service.</p>
                    <p className="font-mono text-xs mt-2">{errorMessage}</p>
                     <Button asChild className="mt-4">
                        <Link href={`/item/${params.id}`}>Try Again</Link>
                    </Button>
                </AlertDescription>
                </Alert>
            </div>
          </AuthenticatedLayout>
        );
    }
}
