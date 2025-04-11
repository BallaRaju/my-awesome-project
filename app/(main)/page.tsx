"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HeartIcon, MessageCircleIcon, BookmarkIcon, SendIcon, MoreHorizontalIcon } from "lucide-react"
import Image from "next/image"

// Sample post data
export type Post = {
  id: string;
  user_id: string;
  image_url: string;
  description: string | null;
  likes: string[];
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url: string;
    full_name: string;
  }
};

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: "1",
    user_id: "user1",
    image_url: "https://images.unsplash.com/photo-1682687218147-9806132dc697",
    description: "Beautiful day at the campus! #collegelife #campus",
    likes: ["user2", "user3", "user4"],
    created_at: "2025-04-10T10:30:00Z",
    updated_at: "2025-04-10T10:30:00Z",
    user: {
      username: "sarah_j",
      avatar_url: "https://randomuser.me/api/portraits/women/44.jpg",
      full_name: "Sarah Johnson"
    }
  },
  {
    id: "2",
    user_id: "user2",
    image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
    description: "Study session at the library. Finals week is coming! 📚 #studyhard #finals",
    likes: ["user1", "user5"],
    created_at: "2025-04-09T15:45:00Z",
    updated_at: "2025-04-09T15:45:00Z",
    user: {
      username: "mike_p",
      avatar_url: "https://randomuser.me/api/portraits/men/32.jpg",
      full_name: "Mike Peterson"
    }
  },
  {
    id: "3",
    user_id: "user3",
    image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    description: "College fest was amazing! Can't wait for next year! 🎉 #collegefest #memories",
    likes: ["user1", "user2", "user4", "user5"],
    created_at: "2025-04-08T20:15:00Z",
    updated_at: "2025-04-08T20:15:00Z",
    user: {
      username: "alex_k",
      avatar_url: "https://randomuser.me/api/portraits/men/22.jpg",
      full_name: "Alex Kim"
    }
  }
];

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const toggleLike = () => setLiked(!liked);
  const toggleSave = () => setSaved(!saved);
  
  return (
    <Card className="mb-4 max-w-xl mx-auto border shadow-sm">
      <CardHeader className="p-1 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={post.user?.avatar_url} alt={post.user?.username} />
              <AvatarFallback>{post.user?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.user?.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-1 pt-0">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <Image 
            src={post.image_url} 
            alt="Post" 
            className="h-full w-full object-cover"
            width={500}
            height={500}
            sizes="(max-width: 768px) 100vw, 500px"
            priority
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={toggleLike}
            >
              <HeartIcon 
                className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : ""}`} 
              />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircleIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <SendIcon className="h-5 w-5" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={toggleSave}
          >
            <BookmarkIcon 
              className={`h-5 w-5 ${saved ? "fill-current" : ""}`} 
            />
          </Button>
        </div>
        <div className="mt-1">
          <p className="text-xs font-medium">{post.likes.length} likes</p>
          <div className="mt-1">
            <span className="text-xs font-medium">{post.user?.username}</span>{" "}
            <span className="text-xs">{post.description}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

function PostSkeleton() {
  return (
    <Card className="mb-4 max-w-md mx-auto border shadow-sm">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-7" />
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <Skeleton className="aspect-square w-full" />
      </CardContent>
      <CardFooter className="flex flex-col items-start p-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="mt-1 w-full">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-1 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-3/4" />
          <Skeleton className="mt-1 h-2 w-12" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default function Page() {
  const { isLoading } = useAuth();
  const [posts] = useState<Post[]>(mockPosts);
  
  return (
    <div className="py-4">
      {isLoading ? (
        // Loading skeletons
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length > 0 ? (
        // Posts feed
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
          <p className="text-muted-foreground mb-6">
            Follow people or create your first post to see content here.
          </p>
          <Button>Explore People</Button>
        </div>
      )}
    </div>
  );
}
