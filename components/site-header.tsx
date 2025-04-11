"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useMemo } from "react"

function formatFullPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "Home"
  return segments
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("/")
}

export function SiteHeader() {
  const pathname = usePathname()

  const title = useMemo(() => formatFullPath(pathname), [pathname])

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
