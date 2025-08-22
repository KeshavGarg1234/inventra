
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import type { Html5QrcodeResult } from 'html5-qrcode/html5-qrcode-result';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getData } from '@/app/actions';
import type { Item, SubItem } from '@/types';

const QR_REGION_ID = 'qr-reader-region-dialog';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromSecurePage?: boolean;
  onSecureScanSuccess?: (item: Item, subItem: SubItem) => void;
}

export function ScannerDialog({ open, onOpenChange, fromSecurePage = false, onSecureScanSuccess }: ScannerDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const findItemBySubItemId = async (subItemId: string): Promise<{item: Item, subItem: SubItem} | null> => {
    const { items } = await getData();
    for (const item of items) {
        const subItem = (item.subItems || []).find(si => si.id === subItemId);
        if (subItem) {
            return { item, subItem };
        }
    }
    return null;
  };

  const onScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
    if (scannerRef.current?.isScanning) {
        try {
            await scannerRef.current.stop();
        } catch (e) {
            console.warn("Scanner already stopped or failed to stop.", e);
        }
    }
    
    onOpenChange(false); // Close the dialog immediately

    toast({
      title: "Scan Successful!",
      description: `Scanned ID: ${decodedText}. Finding item...`
    });

    const findResult = await findItemBySubItemId(decodedText);

    if (findResult) {
      const { item, subItem } = findResult;
      if (fromSecurePage && onSecureScanSuccess) {
        onSecureScanSuccess(item, subItem);
      } else {
        router.push(`/item/${item.id}?unitId=${decodedText}`);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Item Not Found',
        description: `No item in the inventory contains a unit with ID: ${decodedText}`
      });
    }
  };

  const onScanFailure = (error: string) => {
    // This is called frequently, so we don't want to spam the console.
  };

  useEffect(() => {
    if (!open) {
      // Cleanup when dialog is closed
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.warn("Error stopping scanner on close", e));
      }
      return;
    }
    
    // Request camera permission
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setHasPermission(true);
          const scanner = new Html5Qrcode(QR_REGION_ID);
          scannerRef.current = scanner;
          
          scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            onScanSuccess,
            onScanFailure
          ).catch(err => {
              console.error("Error starting scanner:", err);
              setHasPermission(false);
          });
        } else {
          setHasPermission(false);
        }
      })
      .catch(err => {
        console.error("Error getting camera permission:", err);
        setHasPermission(false);
      });

    // Cleanup function on unmount or when `open` changes to false
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.warn("Error stopping scanner on cleanup", e));
      }
    };
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at a unit's QR code to view its details.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          {hasPermission === false && (
            <Alert variant="destructive">
              <VideoOff className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use the scanner.
              </AlertDescription>
            </Alert>
          )}
           <div id={QR_REGION_ID} className="w-full aspect-square rounded-md bg-muted" />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
