'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { GridIcon, HeartIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Image from 'next/image';
import type { Post } from '@/hooks/use-post';
import { useParams } from 'next/navigation';


export default function ProfilePage() {
  const params = useParams(); 
  const profileId = params.profileId;
  const supabase = createClient();
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    college: '',
    avatarUrl: null,
    friends: [] as string[],
    posts: [] as Post[],
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Set initial form data when profile loads
  useEffect(() => {
    const getUserProfile = async () => {
      if (!profileId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, college, avatar_url, friends')
        .eq('id', profileId)
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
      if (postsError) {
        toast.error(postsError.message);
        return;
      }
      if (data) {
        setFormData({
          fullName: data.full_name || '',
          bio: data.bio || '',
          college: data.college || '',
          avatarUrl: data.avatar_url || null,
          friends: data.friends || [],
          posts: posts || [],
        });
      }
      setIsLoading(false);
    };
    getUserProfile();
  }, [profileId, supabase]);




  if (isLoading) {
    return (
      <>
        <div className="container max-w-4xl mx-auto py-6 px-4">
          {/* Profile header */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
            {/* Profile picture skeleton */}
            <div className="flex justify-center w-full md:w-auto">
              <Skeleton className="h-24 w-24 md:h-36 md:w-36 rounded-full" />
            </div>

            {/* Profile info skeleton */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>

              {/* Stats row skeleton */}
              <div className="flex gap-6 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>

              {/* Bio skeleton */}
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="w-full border-t border-gray-200 pt-4">
            <div className="grid grid-cols-3 w-full max-w-md mx-auto gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Content area skeleton */}
            <div className="mt-6">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-64 mb-6" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
          {/* Profile picture */}
          <div className="flex justify-center w-full md:w-auto">
            {formData.avatarUrl && <Avatar className="h-24 w-24 md:h-36 md:w-36">
              <AvatarImage src={formData.avatarUrl} alt="Profile" />
              <AvatarFallback>{formData.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>}
          </div>

          {/* Profile info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h1 className="text-xl font-semibold">{formData.fullName || 'college user'}</h1>
              
            </div>

            {/* Stats row */}
            <div className="flex gap-6 mb-4">
              <div className="font-medium">
                <span className="font-semibold">{formData.posts?.length || 0}</span> posts
              </div>
              <div className="font-medium">
                <span className="font-semibold">{formData.friends?.length || 52}</span> friends
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{formData.college}</h2>
              {formData.bio && <p>{formData.bio}</p>}
            </div>
          </div>
        </div>


        {/* Tabs for Posts, Saved, Tagged */}
        <Tabs defaultValue="posts" className="w-full border-t border-gray-200">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <GridIcon className="h-4 w-4" />
              <span className="hidden sm:inline">POSTS</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <HeartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">LIKED</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            {/* Grid of posts */}
            {formData.posts?.length ? (
              <div className="grid grid-cols-3 gap-1">
                {/* Post thumbnails would go here */}
                {formData.posts.map((post, index) => (
                  <div key={post.id} className="col-span-1">
                    <button 
                      type="button"
                      className="w-full h-full p-0 border-0 bg-transparent cursor-pointer"
                      onClick={() => {
                        setSelectedPost(post);
                        setCurrentPostIndex(index);
                        setPostDialogOpen(true);
                      }}
                      aria-label={`View details of post ${post.description || ''}`}
                    >
                      <Image
                        src={post.image_url}
                        alt="Post"
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
                <p className="text-gray-500 mb-6">When you share photos, they&apos;ll appear here.</p>
                <Button disabled variant="outline" className="bg-card border-2 border-muted rounded-md shadow-sm">Share your first photo by clicking create post</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <h2 className="text-xl font-semibold mb-2">Only you can see what you&apos;ve saved</h2>
              <p className="text-gray-500">When you save something, it&apos;ll appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formData.avatarUrl && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={formData.avatarUrl} />
                    <AvatarFallback>{formData.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{formData.fullName}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            {/* Image and counter */}
            <div className="grid grid-cols-4 gap-4 items-center">
              {/* Image - spans 4 columns on mobile, 2 columns centered on larger screens */}
              <div className="col-span-4 md:col-span-2 md:col-start-2 relative aspect-square rounded-md overflow-hidden shadow-md mx-auto w-full max-w-md">
                {selectedPost && (
                  <Image
                    src={selectedPost.image_url}
                    alt="Post"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
            
            {/* Post counter indicator */}
            <div className="text-center text-sm font-medium text-gray-500 mb-2">
              {formData.posts ? `${currentPostIndex + 1} / ${formData.posts.length}` : ''}
            </div>
            
            {/* Navigation and details */}
            <div className="grid grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-md">
              {/* Previous button */}
              <div className="flex justify-center items-center">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => {
                    if (formData.posts && currentPostIndex > 0) {
                      const newIndex = currentPostIndex - 1;
                      setCurrentPostIndex(newIndex);
                      setSelectedPost(formData.posts[newIndex]);
                    }
                  }}
                  disabled={currentPostIndex <= 0}
                  aria-label="Previous post"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
              
              {/* Post details - spans 2 columns */}
              <div className="col-span-2 flex flex-col">
                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm">{selectedPost?.description}</p>
                </div>
                
                {/* Likes */}
                <div className="flex items-center gap-2 mb-4">
                  <HeartIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">
                    {selectedPost?.likes?.length || 0} likes
                  </span>
                </div>
                
                {/* Date */}
                <div className="mt-auto">
                  <p className="text-xs text-gray-500">
                    {selectedPost && new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {/* Next button */}
              <div className="flex justify-center items-center">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => {
                    if (formData.posts && currentPostIndex < formData.posts.length - 1) {
                      const newIndex = currentPostIndex + 1;
                      setCurrentPostIndex(newIndex);
                      setSelectedPost(formData.posts[newIndex]);
                    }
                  }}
                  disabled={!formData.posts || currentPostIndex >= formData.posts.length - 1}
                  aria-label="Next post"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}