
"use client";

import React, { useMemo, useEffect, useState } from "react";
import type {Notification, NotificationStatus} from "@/types";
import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {format, formatDistanceToNow, isAfter, parseISO, subDays} from "date-fns";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {handleNotificationAction} from "@/app/actions";
import {useToast} from "@/hooks/use-toast";
import {Bell, Check, HandPlatter, Trash2, Undo2, UserPlus, UserX, X} from "lucide-react";
import {db} from "@/lib/firebase/config";
import {onValue, ref} from "firebase/database";

type NotificationsViewProps = {
  initialNotifications: Notification[];
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


const notificationIcons: Partial<Record<Notification['type'], React.ElementType>> = {
    allot: HandPlatter,
    unallot: UserX,
    discard: Trash2,
    restore: Undo2,
    register: UserPlus,
}

const statusVariant: Record<NotificationStatus, "default" | "secondary" | "destructive"> = {
    pending: 'default',
    approved: 'secondary',
    rejected: 'destructive'
}

const NotificationDetails = ({ notification }: { notification: Notification }) => {
    const { requestedData } = notification;
    const requester = requestedData?.requester;

    const RequesterInfo = () => requester ? (
        <p className="mt-2 pt-2 border-t"><strong>By:</strong> {requester.name} ({requester.personId})</p>
    ) : null;

    if (notification.type === 'register' && requestedData?.newUser) {
        const details = requestedData.newUser;
        return (
            <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Name:</strong> {details.name}</p>
                <p><strong>Email:</strong> {details.email}</p>
                <p><strong>ID:</strong> {details.personId}</p>
                <p><strong>Phone:</strong> {details.phone}</p>
            </div>
        )
    }
    if ((notification.type === 'allot' || notification.type === 'unallot') && requestedData?.assignmentDetails) {
        const details = requestedData.assignmentDetails;
        const title = notification.type === 'allot' ? 'To:' : 'From:';
        return (
            <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>{title}</strong> {details.name} ({details.personId})</p>
                <p><strong>Phone:</strong> {details.phone}</p>
                {details.department && <p><strong>Dept:</strong> {details.department}</p>}
                {details.section && <p><strong>Section:</strong> {details.section}</p>}
                {details.project && <p><strong>Project:</strong> {details.project}</p>}
                <RequesterInfo />
            </div>
        )
    }
    
    // For discard, restore
    if (requester) {
         return (
            <div className="text-xs text-muted-foreground space-y-1">
               <RequesterInfo />
            </div>
        )
    }

    return null;
}

export function NotificationsView({ initialNotifications }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const { toast } = useToast();
  
  useEffect(() => {
    const notifsRef = ref(db, `notifications`);
    
    const unsubscribe = onValue(notifsRef, (snapshot) => {
        if (snapshot.exists()) {
            const notifsData = firebaseObjectToArray<Notification>(snapshot.val());
            setNotifications(notifsData);
        } else {
            setNotifications([]);
        }
    }, (error) => {
        console.error("Error fetching real-time notifications:", error);
    });

    return () => {
        unsubscribe();
    };
  }, []);

  const handleAction = async (notificationId: string, action: 'approve' | 'reject') => {
    const result = await handleNotificationAction(notificationId, action);
    if (result.success) {
      toast({
        title: "Success",
        description: result.message
      });
      // The listener will update the state, but we can do an optimistic update for perceived speed.
      setNotifications(current =>
        current.map(n =>
          n.id === notificationId
            ? { ...n, status: action, handledAt: new Date().toISOString() }
            : n
        ).filter(n => !(result.message?.includes("already been handled") && n.id === notificationId)) // Also remove if it was stale
      );
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
      // If the error indicates it was already handled, remove it from the list
      if (result.message?.includes("already been handled")) {
          setNotifications(current => current.filter(n => n.id !== notificationId));
      }
    }
  };

  const { pending, handled } = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    return {
      pending: sorted.filter(n => n.status === 'pending'),
      handled: sorted.filter(n => n.status !== 'pending' && n.handledAt && isAfter(parseISO(n.handledAt), thirtyDaysAgo))
    };
  }, [notifications]);

  const renderTable = (data: Notification[], isPending: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>{isPending ? 'Requested' : 'Handled'}</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            return (
              <TableRow key={notification.id}>
              <TableCell>
                 <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize font-medium">{notification.type.replace(/-/g, ' ')}</span>
                </div>
              </TableCell>
              <TableCell>{notification.itemName || notification.requestedData?.newUser?.name}</TableCell>
              <TableCell className="font-mono text-xs">{notification.subItemId ||'N/A'}</TableCell>
              <TableCell>
                  <NotificationDetails notification={notification} />
              </TableCell>
              <TableCell>
                <span title={format(parseISO(notification.createdAt), 'PPP p')}>
                    {formatDistanceToNow(parseISO(isPending ? notification.createdAt : notification.handledAt!), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {isPending ? (
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleAction(notification.id, 'reject')}>
                        <X className="mr-2 h-4 w-4"/> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleAction(notification.id, 'approve')}>
                        <Check className="mr-2 h-4 w-4"/> Approve
                    </Button>
                  </div>
                ) : (
                  <Badge variant={statusVariant[notification.status]}>{notification.status}</Badge>
                )}
              </TableCell>
            </TableRow>
            )
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No {isPending ? 'pending requests' : 'handled requests from the last 30 days'} found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Notifications</h1>
          <p className="text-muted-foreground">Approve or reject pending requests.</p>
        </div>
      </div>
      <Card>
          <CardContent className="p-0">
             <Tabs defaultValue="pending">
                <div className="p-4 border-b">
                    <TabsList>
                        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                        <TabsTrigger value="handled">Recent Handled</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="pending" className="m-0">
                    {renderTable(pending, true)}
                </TabsContent>
                <TabsContent value="handled" className="m-0">
                     {renderTable(handled, false)}
                </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
    </>
  );
}
