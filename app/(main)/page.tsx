"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HeartIcon, MessageCircleIcon, BookmarkIcon, SendIcon, MoreHorizontalIcon } from "lucide-react"
import Image from "next/image"
import { getAllPosts, type Post } from "@/hooks/use-post"
import { useRouter } from "next/navigation"


function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const toggleLike = () => setLiked(!liked);
  const toggleSave = () => setSaved(!saved);
  const router = useRouter();

  if(!post) return null;
  const handleProfile = () => {
    router.push(`/profile/${post.user_id}`);
  }
  
  return (
    <Card className="mb-4 max-w-xl mx-auto border shadow-sm">
      <CardHeader className="p-1 pb-0">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="flex items-center gap-2 cursor-pointer" onClick={handleProfile} onKeyDown={handleProfile} >
            {post.full_name&& post.avatar_url&& <Avatar className="h-7 w-7">
              <AvatarImage src={post.avatar_url} alt={post.full_name} loading="lazy"/>
              <AvatarFallback>{post.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>}
            <div>
              <p className="text-sm font-medium">{post.full_name}</p>
            </div>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-1 pt-0">
        <div className="w-full overflow-hidden bg-muted">
          <Image 
            src={post.image_url} 
            alt="Post" 
            className="h-full w-full object-contain"
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
            <span className="text-xs font-medium">{post.full_name}</span>{" "}
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
    <Card className="mb-4 max-w-2xl mx-auto border shadow-sm">
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
  const { isLoading, profile } = useAuth();
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    
    const getPosts = async () => {
      if (profile?.friends) {
        setIsLoadingPosts(true);
        const myPosts = await getAllPosts(profile.friends);
        console.log(myPosts);
        setPosts(myPosts);
      }
        setIsLoadingPosts(false);
    };
    getPosts();
  }, [profile]);

  console.log("posts", posts)

  if(isLoading || isLoadingPosts){
    return (
      <>
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </>
    )
  }
  
  return (
    <div className="py-4">
      {posts.length > 0 ? (
        // Posts feed
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      ) :  (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
          <p className="text-muted-foreground mb-6">
            Follow people or create your first post to see content here.
          </p>
          <Button>Explore People</Button>
        </div>
      ) }
    </div>
  );
}
