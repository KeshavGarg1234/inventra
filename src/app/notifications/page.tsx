
import { getData } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { NotificationsView } from "./notifications-view";
import AuthenticatedLayout from "@/components/authenticated-layout";

export default async function NotificationsPage() {
  try {
    const { notifications } = await getData();
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-4 md:p-8">
          <NotificationsView initialNotifications={notifications} />
        </div>
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
            <AlertTitle>Failed to Load Notifications</AlertTitle>
            <AlertDescription>
              <p>There was a problem connecting to the database. This might be a temporary issue.</p>
              <p className="font-mono text-xs mt-2">{errorMessage}</p>
              <Button asChild className="mt-4">
                <Link href="/notifications">Try Again</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AuthenticatedLayout>
    );
  }
}
