"use client"

import {
  ArrowUpCircleIcon,
  HashIcon,
  SearchIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react"

import { NavMain } from "./nav-main"
// import { NavSecondary } from "./nav-secondary"
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

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input"
import { useAuth } from "@/hooks/use-auth"
import type { Profile } from "@/hooks/use-post"

// Dummy data for search and notifications
const searchSuggestions = [
  { type: "hashtag", text: "#college", icon: HashIcon },
  { type: "hashtag", text: "#campus", icon: HashIcon },
  { type: "trending", text: "Campus Events", icon: TrendingUpIcon },
  { type: "user", text: "Sarah Johnson", image: "/avatars/sarah.jpg" },
  { type: "user", text: "Mike Peterson", image: "/avatars/mike.jpg" },
]

const notifications = [
  { 
    id: 1, 
    user: "Alex Kim", 
    action: "liked your post", 
    time: "2m ago", 
    read: false,
    avatar: "/avatars/alex.jpg"
  },
  { 
    id: 2, 
    user: "Jamie Smith", 
    action: "started following you", 
    time: "1h ago", 
    read: false,
    avatar: "/avatars/jamie.jpg"
  },
  { 
    id: 3, 
    user: "Taylor Jones", 
    action: "commented on your photo", 
    time: "3h ago", 
    read: true,
    avatar: "/avatars/taylor.jpg"
  },
  { 
    id: 4, 
    user: "Jordan Lee", 
    action: "mentioned you in a comment", 
    time: "5h ago", 
    read: true,
    avatar: "/avatars/jordan.jpg"
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Partial<Profile>[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { searchUsers } = useAuth();
  
  // Move useRef hooks to the top level of the component
  const debounceTimeout = useRef<number | null>(null);
  const searchQueryRef = useRef<string>(searchQuery);

  const togglePanel = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId);
    // Reset search when opening panel
    if (panelId === "search" && activePanel !== "search") {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Perform search when query changes
  useEffect(() => {
    // Update the ref when searchQuery changes
    if (searchQueryRef.current !== searchQuery) {
      searchQueryRef.current = searchQuery;
      
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      debounceTimeout.current = window.setTimeout(async () => {
        if (searchQueryRef.current.trim().length === 0) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);
        try {
          console.log("Calling searchUsers with query:", searchQueryRef.current);
          const results = await searchUsers(searchQueryRef.current);
          console.log("Got search results:", results);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          // Ensure we still clear the searching state on error
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 600);
    }

    // Cleanup function
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, searchUsers]);
  
  return (
    <div className="flex">
      <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">COLLEGE NETWORK</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain togglePanel={togglePanel} activePanel={activePanel} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
    </Sidebar>
      {/* Search Panel */}
      {activePanel === "search" && (
        <div className="w-80 border-r border-muted-foreground h-screen overflow-y-auto bg-background animate-in slide-in-from-left">
          <div className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search</h2>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..." 
                className="pl-8 w-full"
                autoFocus
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="p-4">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            ) : searchQuery.trim() !== "" ? (
              <>
                {searchResults && searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Search Results</h3>
                    {searchResults.map((user) => (
                      <Link 
                        href={`/profile/${user.id}`} 
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors"
                      >
                        {user.avatar_url && user.full_name && <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                          <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                        </Avatar>}
                        <div>
                          <p className="text-sm font-medium">{user.full_name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center py-4">
                    <p className="text-sm text-muted-foreground">No users found</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Searches</h3>
                <div className="space-y-2">
                  {searchSuggestions.map((item) => (
                    <Button 
                      key={item.text} 
                      variant="ghost" 
                      className="w-full justify-start h-auto py-2 px-3"
                    >
                      {item.type === "user" ? (
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={item.image} alt={item.text} />
                          <AvatarFallback>{item.text.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        item.icon && <item.icon className="h-4 w-4 mr-2" />
                      )}
                      <span>{item.text}</span>
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {activePanel === "notifications" && (
        <div className="w-80 border-r border-muted-foreground h-screen overflow-y-auto bg-background animate-in slide-in-from-left">
          <div className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="divide-y">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-accent/50 transition-colors ${!notification.read ? 'bg-accent/20' : ''}`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.avatar} alt={notification.user} />
                    <AvatarFallback>{notification.user.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.user}</span>{' '}
                      {notification.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary self-start mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
