"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { createClient } from "@/lib/supabase/client"

const data = {
  navMain: [
    { title: "Dashboard", url: "#", icon: LayoutDashboardIcon },
    { title: "Lifecycle", url: "#", icon: ListIcon },
    { title: "Analytics", url: "#", icon: BarChartIcon },
    { title: "Projects", url: "#", icon: FolderIcon },
    { title: "Team", url: "#", icon: UsersIcon },
  ],
  navSecondary: [
    { title: "Settings", url: "#", icon: SettingsIcon },
    { title: "Get Help", url: "#", icon: HelpCircleIcon },
    { title: "Search", url: "#", icon: SearchIcon },
  ],
  documents: [
    { name: "Data Library", url: "#", icon: DatabaseIcon },
    { name: "Reports", url: "#", icon: ClipboardListIcon },
    { name: "Word Assistant", url: "#", icon: FileIcon },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  const supabase = createClient()

  React.useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data?.user) {
        setUser({
          name: data.user.user_metadata?.name || "Anonymous",
          email: data.user.email,
          avatar: data.user.user_metadata?.avatar_url || "/avatars/default.jpg",
        })
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">COLLEGE NETWORK</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        {!loading && user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
