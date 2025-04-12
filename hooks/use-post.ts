import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Define your database types
export type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  college: string | null;
  avatar_url: string | null;
  friends: string[];
  posts: Post[];
  notifications: Notification[];
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  image_url: string;
  description: string | null;
  likes: string[];
  created_at: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type Notification = {
  id: string;
  type: 'like' | 'follow' | 'new_post';
  user_id: string;
  post_id?: string;
  read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'created_at' | 'updated_at' | 'id'>;
        Update: Partial<Omit<Post, 'created_at' | 'updated_at' | 'id'>>;
      };
    };
    Functions: {
      follow_user: {
        Args: {
          follower_id: string;
          following_id: string;
        };
        Returns: boolean;
      };
      unfollow_user: {
        Args: {
          follower_id: string;
          following_id: string;
        };
        Returns: boolean;
      };
    };
  };
};



// Utility functions for profile management
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId);

    if (postsError) {
      throw postsError;
    }
    // Convert JSONB arrays to proper TypeScript arrays
    const profile = {
      ...data,
      friends: Array.isArray(data.friends) ? data.friends : [],
      posts: Array.isArray(posts) ? posts : [],
      notifications: Array.isArray(data.notifications) ? data.notifications : [],
    };
    
    return profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function followUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    // Use the RPC function to follow a user
    const {  error } = await supabase.rpc('follow_user', {
      follower_id: currentUserId,
      following_id: targetUserId
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

export async function unfollowUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    // Use the RPC function to unfollow a user
    const {  error } = await supabase.rpc('unfollow_user', {
      follower_id: currentUserId,
      following_id: targetUserId
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

export async function createPost(userId: string, imageUrl: string, description: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        description,
        likes: []
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

export async function getAllPosts(userFriends: string[] = []): Promise<Post[]> {
  try {
    // If no friends provided, return empty array
    // if (userFriends.length === 0) {
    //   return [];
    // }
    
    const { data, error } = await supabase
      .from('posts')
      .select('*') // Select all fields from posts
      // .in('user_id', userFriends)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }

    // If no posts found, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    const posts = data.map(async post => {
      const { data: user } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', post.user_id)
        .single();
      
      // Return a complete Post object
      return {
        id: post.id,
        user_id: post.user_id,
        image_url: post.image_url,
        description: post.description || '', // Handle null descriptions
        likes: post.likes || [],
        created_at: post.created_at,
        updated_at: post.updated_at,
        full_name: user?.full_name || null,
        avatar_url: user?.avatar_url || null
      };
    });

    const resolvedPosts = await Promise.all(posts);

    return resolvedPosts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

export async function getFeedPosts(userId: string): Promise<Post[]> {
  try {
    // Get the user's profile to find who they're following
    const profile = await getUserProfile(userId);
    
    if (!profile || !profile.friends.length) {
      return [];
    }
    
    // Get posts from users they're following
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', profile.friends)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return [];
  }
}

export async function likePost(userId: string, postId: string): Promise<boolean> {
  try {
    // First get the current post to check if the user already liked it
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    const likes = Array.isArray(post.likes) ? post.likes : [];
    
    // If user already liked the post, do nothing
    if (likes.includes(userId)) {
      return true;
    }
    
    // Add user to likes array
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        likes: [...likes, userId]
      })
      .eq('id', postId);
      
    if (updateError) {
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
}

export async function unlikePost(userId: string, postId: string): Promise<boolean> {
  try {
    // First get the current post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    const likes = Array.isArray(post.likes) ? post.likes : [];
    
    // Remove user from likes array
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        likes: likes.filter(id => id !== userId)
      })
      .eq('id', postId);
      
    if (updateError) {
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return [];
    }
    
    return profile.notifications || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile || !profile.notifications) {
      return false;
    }
    
    // Find and update the notification
    const updatedNotifications = profile.notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );
    
    // Update the profile
    const { error } = await supabase
      .from('profiles')
      .update({
        notifications: updatedNotifications
      })
      .eq('id', userId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}