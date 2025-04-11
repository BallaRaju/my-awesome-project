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
    );
  }

  return (
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
                <Button variant="outline" size="sm" className="h-9">
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
              <span className="font-semibold">{profile?.followers?.length || 52}</span> followers
            </div>
            <div className="font-medium">
              <span className="font-semibold">{profile?.following?.length || 103}</span> following
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{profile?.college}</h2>
            {profile?.bio && <p>{profile?.bio}</p>}
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
  )
}