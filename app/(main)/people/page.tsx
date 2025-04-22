'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUserProfile, type Profile } from '@/hooks/use-post';
import { Loader2 } from 'lucide-react';

const PeoplePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profile?.id || !profile.friends || profile.friends.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const friendProfiles = await Promise.all(
          profile.friends.map(async (friendId) => {
            const friendProfile = await getUserProfile(friendId);
            return friendProfile;
          })
        );

        // Filter out null profiles
        setFriends(friendProfiles.filter((p): p is Profile => p !== null));
      } catch (error) {
        console.error('Error fetching friends:', error);
        toast.error('Failed to load friends');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [profile]);

  const handleUnfriend = async (friendId: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // 1. Get the current user's friends list
      const { data: currentUser, error: currentError } = await supabase
        .from('profiles')
        .select('friends')
        .eq('id', user.id)
        .single();
      
      if (currentError) throw currentError;

      // 2. Get the friend's friends list
      const { data: friendData, error: friendError } = await supabase
        .from('profiles')
        .select('friends')
        .eq('id', friendId)
        .single();
      
      if (friendError) throw friendError;

      // 3. Remove the friend from the current user's friends list
      const updatedCurrentUserFriends = (currentUser.friends || []).filter(
        (id: string) => id !== friendId
      );

      // 4. Remove the current user from the friend's friends list
      const updatedFriendFriends = (friendData.friends || []).filter(
        (id: string) => id !== user.id
      );

      // 5. Update the current user's friends list
      const { error: updateCurrentError } = await supabase
        .from('profiles')
        .update({ friends: updatedCurrentUserFriends })
        .eq('id', user.id);
      
      if (updateCurrentError) throw updateCurrentError;

      // 6. Update the friend's friends list
      const { error: updateFriendError } = await supabase
        .from('profiles')
        .update({ friends: updatedFriendFriends })
        .eq('id', friendId);
      
      if (updateFriendError) throw updateFriendError;

      // 7. Update the local state
      setFriends(friends.filter((friend) => friend.id !== friendId));
      
      // 8. Refresh the profile to get the updated friends list
      await refreshProfile();
      
      toast.success('Friend removed successfully');
    } catch (error) {
      console.error('Error unfriending user:', error);
      toast.error('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don&apos;t have any friends yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map((friend) => (
            <Card key={friend.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {friend.avatar_url && <Avatar className="h-12 w-12">
                    <AvatarImage src={friend.avatar_url} alt={friend.full_name || ''} loading='lazy' />
                    <AvatarFallback>
                      {friend.full_name?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>}
                  <CardTitle>{friend.full_name}</CardTitle>
                </div>
              </CardHeader>
              
              {friend.bio && (
                <CardContent className="text-sm text-muted-foreground">
                  {friend.bio}
                </CardContent>
              )}
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/profile/${friend.id}`;
                  }}
                >
                  View Profile
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleUnfriend(friend.id)}
                  disabled={loading}
                >
                  Unfriend
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeoplePage;