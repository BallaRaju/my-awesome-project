"use client"

import { useState } from "react"
import { PlusCircleIcon, UsersIcon, SearchIcon, BellIcon, LayoutDashboardIcon, ImageIcon, XIcon } from "lucide-react"
import Link from "next/link"

const items = [
    { title: "Dashboard", url: "/", icon: LayoutDashboardIcon },
    { title: "People", url: "/people", icon: UsersIcon },
    { title: "Search", url: "#", icon: SearchIcon, id: "search" },
    { title: "Notifications", url: "#", icon: BellIcon, id: "notifications" },
]

import {  
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export function NavMain({
  togglePanel,
  activePanel,
}: {
  togglePanel: (panelId: string) => void
  activePanel: string | null
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const { user } = useAuth()
  const supabase = createClient()
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleCreatePost = async () => {
    if (!selectedImage || !user) {
      toast.error("Please select an image to post")
      return
    }
    
    try {
      setIsUploading(true)
      
      // Upload image to storage
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `posts/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, selectedImage)
        
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: publicUrlData } = await supabase.storage
        .from('posts')
        .getPublicUrl(filePath)
        
      // Create post record
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: publicUrlData.publicUrl,
          description: description.trim() || null
        })
        
      if (postError) throw postError
      
      // Success
      toast.success("Post created successfully!")
      resetForm()
      setIsDialogOpen(false)
      
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }
  
  const resetForm = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setDescription("")
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={() => setIsDialogOpen(true)}
            >
              <PlusCircleIcon />
              <span>Create Post</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.id ? (
                // For Search and Notifications - toggle panel
                <SidebarMenuButton
                  onClick={() => togglePanel(item.id)}
                  className={activePanel === item.id ? "bg-accent" : ""}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                // For Dashboard and People - navigate to URL
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
      
      {/* Create Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {imagePreview ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                <Image
                  src={imagePreview} 
                  alt="Preview" 
                  fill
                  className="h-full w-full object-cover"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed p-10">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Drag and drop an image</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
                <Label 
                  htmlFor="picture" 
                  className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Select Image
                </Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Write a caption..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" disabled={isUploading}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleCreatePost} 
              disabled={!selectedImage || isUploading}
            >
              {isUploading ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  )
}
