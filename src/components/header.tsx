
"use client"

import React, { useState, useEffect } from "react"
import { Archive, FileText, Users, LayoutDashboard, LogOut, Bell, Sun, Moon, Menu } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { QrScanner } from "./qr-scanner"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase/config"
import { ref, onValue } from "firebase/database"
import type { Notification } from "@/types"

function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean);
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const { user, dbUser, loading } = useAuth();
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const notificationsRef = ref(db, `notifications`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
        if (snapshot.exists()) {
            const notifications = firebaseObjectToArray<Notification>(snapshot.val());
            const pendingExists = notifications.some(n => n.status === 'pending');
            setHasPending(pendingExists);
        } else {
            setHasPending(false);
        }
    }, (error) => {
        console.error("Error fetching real-time notification status:", error);
    });

    return () => {
        unsubscribe();
    };
  }, [user]);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Archive },
    { href: "/bills", label: "Bills", icon: FileText },
    { href: "/users", label: "Users", icon: Users },
  ];
  
  const handleSignOut = async () => {
      await signOut(auth);
      router.push('/');
  }

  const isAuthPage = ['/', '/register'].includes(pathname);
  
  if (loading || isAuthPage || dbUser?.role === 'E') {
    return null;
  }
  
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
      <div className="container flex h-14 max-w-screen-2xl items-center">
        
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="grid gap-4 text-lg font-medium mt-6">
                 {navLinks.map(link => (
                    <SheetClose asChild key={link.href}>
                        <Link
                            href={link.href}
                            className={cn(
                                "flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:text-foreground",
                                pathname.startsWith(link.href) ? "bg-muted text-foreground" : "text-muted-foreground"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    </SheetClose>
                    ))}
                </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2 group">
             <Archive className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-lg animate-text-shimmer bg-clip-text text-transparent">
              inventra
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
             {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                    "transition-colors hover:text-foreground/80 flex items-center gap-2",
                    pathname.startsWith(link.href) ? "text-foreground font-semibold" : "text-foreground/60"
                    )}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
                ))}
          </nav>
        </div>

        {/* Common Right-side Icons */}
        <div className="flex flex-1 items-center justify-end space-x-2">
            <Link href="/dashboard" className="flex items-center space-x-2 md:hidden">
                <Archive className="h-6 w-6 text-primary" />
                <span className="sr-only">Inventra</span>
            </Link>

            <Button variant="ghost" size="icon" asChild className="relative hover-animate-ring">
                <Link href="/notifications">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {hasPending && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500" />}
                    <span className="sr-only">Notifications</span>
                </Link>
            </Button>
            
            <QrScanner />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover-animate-spin">
                  <Sun className="icon-sun h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="icon-moon absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuLabel>Theme</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="hover-animate-lock">
                    <LogOut className="h-[1.2rem] w-[1.2rem] lock-shackle" />
                    <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start" disabled>
                   <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                   <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
