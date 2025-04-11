'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useEffect, ReactNode } from 'react';

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
    children: ReactNode;
  }
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  
    return (
            <SidebarProvider>
              <AppSidebar variant="inset" />
              <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                  <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                      {/* <SectionCards /> */}
                      { children  }
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          );
  
  
}