'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { GridIcon, HeartIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Image from 'next/image';
import type { Post } from '@/hooks/use-post';

export default function ProfilePage() {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = createClient();
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    college: '',
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);

  // Set initial form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        bio: profile.bio || '',
        college: profile.college || '',
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Create preview when avatar file is selected
  useEffect(() => {
    if (avatar) {
      const objectUrl = URL.createObjectURL(avatar);
      setAvatarUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [avatar]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      setAvatar(event.target.files[0]);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function uploadAvatar(avatar: File): Promise<string | null> {
    if (!user) return null;
    
    try {
      setUploading(true);
      
      // Get file extension
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload the avatar to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      // Upload avatar if a new one was selected
      let avatarPublicUrl = null;
      if (avatar) {
        avatarPublicUrl = await uploadAvatar(avatar);
      }

      // Prepare profile update data
      const updates = {
        id: user.id,
        full_name: formData.fullName,
        bio: formData.bio,
        college: formData.college,
        ...(avatarPublicUrl && { avatar_url: avatarPublicUrl }),
        updated_at: new Date().toISOString(),
      };

      // Update the profile
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Show success message
      toast.success('Profile updated successfully');

      // Refresh profile data
      refreshProfile();
      
      // Close dialog
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

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
            <Avatar className="h-24 w-24 md:h-36 md:w-36">
              <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
              <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>

          {/* Profile info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h1 className="text-xl font-semibold">{profile?.full_name || 'college user'}</h1>
              
              {/* Edit Profile button trigger for dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" type="button" className="h-9">
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl || profile?.avatar_url || ''} alt="Profile" />
                        <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="avatar">Profile Picture</Label>
                        <Input 
                          id="avatar" 
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself"
                          rows={3}
                        />
                      </div>

                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="college">College</Label>
                        <Input
                          id="college"
                          name="college"
                          value={formData.college}
                          onChange={handleInputChange}
                          placeholder="Your college or university"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={saving || uploading}
                      >
                        {(saving || uploading) ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 mb-4">
              <div className="font-medium">
                <span className="font-semibold">{profile?.posts?.length || 0}</span> posts
              </div>
              <div className="font-medium">
                <span className="font-semibold">{profile?.friends?.length || 52}</span> friends
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{profile?.college}</h2>
              {profile?.bio && <p>{profile.bio}</p>}
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
            {profile?.posts?.length ? (
              <div className="grid grid-cols-3 gap-1">
                {/* Post thumbnails would go here */}
                {profile.posts.map((post, index) => (
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
              {profile && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.full_name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{profile.full_name || user?.email}</span>
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
              {profile?.posts ? `${currentPostIndex + 1} / ${profile.posts.length}` : ''}
            </div>
            
            {/* Navigation and details */}
            <div className="grid grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-md">
              {/* Previous button */}
              <div className="flex justify-center items-center">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => {
                    if (profile?.posts && currentPostIndex > 0) {
                      const newIndex = currentPostIndex - 1;
                      setCurrentPostIndex(newIndex);
                      setSelectedPost(profile.posts[newIndex]);
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
                    if (profile?.posts && currentPostIndex < profile.posts.length - 1) {
                      const newIndex = currentPostIndex + 1;
                      setCurrentPostIndex(newIndex);
                      setSelectedPost(profile.posts[newIndex]);
                    }
                  }}
                  disabled={!profile?.posts || currentPostIndex >= profile.posts.length - 1}
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