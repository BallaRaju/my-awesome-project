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
import type { Notification, Profile } from "@/hooks/use-post"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Dummy data for search and notifications
const searchSuggestions = [
  { type: "hashtag", text: "#college", icon: HashIcon },
  { type: "hashtag", text: "#campus", icon: HashIcon },
  { type: "trending", text: "Campus Events", icon: TrendingUpIcon },
  { type: "user", text: "Sarah Johnson", image: "/avatars/sarah.jpg" },
  { type: "user", text: "Mike Peterson", image: "/avatars/mike.jpg" },
]


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Partial<Profile>[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { searchUsers,profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();
  const router = useRouter();

  
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

  useEffect(() => {
    const fetchNotifications = async () => {
      if(!profile?.id) return;
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (notificationsError) {
        toast.error(notificationsError.message);
        return;
      }

      if (!notificationsData) return;

      const notifications: Notification[] = [];

      for(const notification of notificationsData) {
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', notification.sender_id)
          .single();
        
        if (userError) {
          toast.error(userError.message);
          return;
        }
        
        notifications.push({
          ...notification,
          user: user
        });
      }
      
      setNotifications(notifications);
    };
    
    if (profile?.id) {
      fetchNotifications();
    }
  }, [profile?.id,supabase]);
  
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

  const handleNotificationClick = (notification: Notification) => {
    if(!notification.is_read){
      try {
        supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error marking notification as read:', error);
            }
          });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    router.push(`/profile/${notification.sender_id}`);
  };

  const handleSuggestionAction = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Prevent triggering the parent notification click
    
    // Just dismiss the suggestion
    await deleteNotification(e, notification.id);
  };

  const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
        return;
      }
      
      // Update local state by removing the deleted notification
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

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
                className={`flex p-4 hover:bg-accent/50 transition-colors ${!notification.is_read ? 'bg-accent/20' : ''} ${notification.type === 'suggestion' ? 'border-l-4 border-primary' : ''}`}
              >
                <button 
                  type="button"
                  className="flex gap-3 flex-1 cursor-pointer text-left bg-transparent border-0 p-0"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={notification.user.avatar_url || ""} alt={notification.user.full_name || ""} />
                    <AvatarFallback>{notification.user.full_name?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="text-sm flex flex-col">
                      <span className="font-semibold">{notification.user.full_name}</span>{' '}
                      {notification.type === 'like' && 'liked your post'}
                      {notification.type === 'follow' && 'request to follow you'}
                      {notification.type === 'new_post' && 'shared a new post'}
                      {notification.type === 'accept' && 'accepted your follow request'}
                      {notification.type === 'suggestion' && (
                        <span className="text-primary-foreground bg-primary px-1.5 py-0.5 rounded-sm text-xs ml-1 w-fit">
                          Suggested Friend
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const now = new Date().getTime()
                        const then = new Date(notification.created_at).getTime()
                        const diff = (now - then) / 1000
                        if (diff < 60) return ` ${Math.floor(diff)}s ago`
                        if (diff < 60 * 60) return ` ${Math.floor(diff / 60)}m ago`
                        if (diff < 60 * 60 * 24) return ` ${Math.floor(diff / (60 * 60))}h ago`
                        return ` ${Math.floor(diff / (60 * 60 * 24))}d ago`
                      })()}
                    </p>
                  </div>
                </button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2" 
                  onClick={(e) => notification.type === 'suggestion' 
                    ? handleSuggestionAction(e, notification)
                    : deleteNotification(e, notification.id)
                  }
                  title="Dismiss"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
                
                {!notification.is_read && notification.type !== 'suggestion' && (
                  <div className="h-2 w-2 rounded-full bg-primary absolute top-4 right-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
