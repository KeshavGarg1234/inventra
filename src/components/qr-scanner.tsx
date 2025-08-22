
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { ScannerDialog } from './scanner-dialog';

export function QrScanner() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsScannerOpen(true)} className="relative overflow-hidden hover-animate-scan">
        <ScanLine className="h-[1.2rem] w-[1.2rem]" />
        <div className="scan-line-inner absolute left-0 w-full h-0.5 bg-primary/80 rounded-full" />
        <span className="sr-only">Scan QR Code</span>
      </Button>
      <ScannerDialog open={isScannerOpen} onOpenChange={setIsScannerOpen} />
    </>
  );
}
