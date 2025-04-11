'use client';
import React from 'react';
import type { ReactNode } from 'react';

import { AppSidebar } from "@/components/app-sidebar"
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
                      { children  }
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          );
  
  
}