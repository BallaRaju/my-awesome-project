import torch
from torch_geometric.data import Data
from torch_geometric.nn import GCNConv
import torch.nn.functional as F
import itertools
from supabase import create_client


# Initialize Supabase client
# supabase_url = os.getenv("SUPABASE_URL")
# supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client("https://ddjxedjqthoxlniocytt.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkanhlZGpxdGhveGxuaW9jeXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NDAyODksImV4cCI6MjA1OTAxNjI4OX0.O4bMx3XVQ9BByXVothxQXfzKmiFfu9uExxg52yyIxJc")

# === GCN Model with Embedding ===
class GCN(torch.nn.Module):
    def __init__(self, num_nodes, embedding_dim, hidden_channels):
        super(GCN, self).__init__()
        self.embedding = torch.nn.Embedding(num_nodes, embedding_dim)
        self.conv1 = GCNConv(embedding_dim, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)

    def forward(self, edge_index):
        x = self.embedding.weight
        x = F.relu(self.conv1(x, edge_index))
        x = F.relu(self.conv2(x, edge_index))
        return x

# === Main Function ===
def predict_new_links(new_edges_list, model_path='gcn_embed_model.pth', top_k=4, trained_num_nodes=37700, embedding_dim=64, hidden_channels=32):
    # Convert new edges to tensor format
    edge_index = torch.tensor(new_edges_list, dtype=torch.long).t()

    # Create set of existing edges
    existing_edges = set(tuple(sorted(edge)) for edge in new_edges_list)

    # Infer number of nodes from new edges
    node_ids = set([u for u, v in new_edges_list] + [v for u, v in new_edges_list])
    num_nodes = max(node_ids) + 1

    # Generate all possible candidate edges
    all_possible_edges = list(itertools.combinations(range(num_nodes), 2))
    candidate_edges = [e for e in all_possible_edges if tuple(sorted(e)) not in existing_edges]

    # Load model
    model = GCN(trained_num_nodes, embedding_dim, hidden_channels)
    model.load_state_dict(torch.load(model_path))
    model.eval()

    # Pad edge_index with proper number of nodes
    data = Data(edge_index=edge_index, num_nodes=trained_num_nodes)

    # Prediction
    @torch.no_grad()
    def predict_missing_links(model, edge_index, candidate_edges, top_k):
        embeddings = model(edge_index)
        if not candidate_edges:
            return [], []

        edge_tensor = torch.tensor(candidate_edges, dtype=torch.long).t()
        src, dst = edge_tensor[0], edge_tensor[1]
        scores = torch.sigmoid(torch.sum(embeddings[src] * embeddings[dst], dim=1))
        top_k = min(top_k, len(candidate_edges))
        top_scores, top_indices = torch.topk(scores, top_k)
        top_edges = [candidate_edges[i] for i in top_indices.tolist()]
        return top_edges, top_scores.tolist()

    # Get top predictions
    top_predicted_edges, top_confidences = predict_missing_links(model, edge_index, candidate_edges, top_k)
    
    # Return only the node pairs without scores
    return top_predicted_edges

# === Supabase Integration for Friend Suggestions ===

def fetch_users_and_friends():
    """
    Fetch all users and their friends from Supabase
    Returns:
        - user_list: List of all user IDs
        - friendship_edges: List of tuples representing friendship connections
    """
    try:
        # Fetch all users
        response = supabase.table('profiles').select('id, friends').execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error fetching users: {response.error}")
            return [], []
        
        # Extract user IDs and friendship connections
        user_list = []
        friendship_edges = []
        
        for user in response.data:
            user_id = user['id']
            user_list.append(user_id)
            
            # Extract friendship connections
            friends = user.get('friends', [])
            if friends and isinstance(friends, list):
                for friend_id in friends:
                    # Only add each edge once (avoid duplicates)
                    if user_id < friend_id:  # Ensure consistent ordering
                        friendship_edges.append((user_id, friend_id))
        
        return user_list, friendship_edges
    
    except Exception as e:
        print(f"Error fetching data from Supabase: {e}")
        return [], []

def get_all_friend_suggestions(top_k=4):
    """
    Get friend suggestions for all users
    Args:
        top_k: Number of suggestions to return per user
    Returns:
        Dictionary mapping user IDs to their suggested friends
    """
    # Fetch all users and friendship edges
    user_list, friendship_edges = fetch_users_and_friends()
    
    if not user_list or not friendship_edges:
        print("No users or friendship data available")
        return {}
    
    # Create a mapping from user IDs to consecutive integers
    user_to_index = {user: idx for idx, user in enumerate(user_list)}
    index_to_user = {idx: user for idx, user in enumerate(user_list)}
    
    # Convert friendship edges to use consecutive integers
    numeric_edges = [(user_to_index[u], user_to_index[v]) for u, v in friendship_edges 
                     if u in user_to_index and v in user_to_index]
    
    print(f"Converted {len(user_list)} users to consecutive integers")
    print(f"Converted {len(friendship_edges)} friendship edges to numeric edges")
    print("Sample of numeric edges:", numeric_edges[:5] if len(numeric_edges) > 5 else numeric_edges)
    
    # Get predictions using the existing model
    predicted_edges = predict_new_links(numeric_edges, top_k=top_k*len(user_list))  # Get more predictions to ensure each user gets some
    
    print(f"Got {len(predicted_edges)} predicted edges")
    
    # Convert numeric predictions back to user IDs
    user_predictions = {}
    
    # Initialize empty suggestions list for each user
    for user_id in user_list:
        user_predictions[user_id] = []
    
    # Process each predicted edge
    for u_idx, v_idx in predicted_edges:
        u_id = index_to_user[u_idx]
        v_id = index_to_user[v_idx]
        
        # Add suggestion for both users (if not already at top_k)
        if len(user_predictions[u_id]) < top_k:
            user_predictions[u_id].append(v_id)
        
        if len(user_predictions[v_id]) < top_k:
            user_predictions[v_id].append(u_id)
    
    return user_predictions

def create_suggestion_notifications(suggestions_dict):
    """
    Create notifications in Supabase for each suggested friend
    Args:
        suggestions_dict: Dictionary mapping user IDs to their suggested friends
    Returns:
        Number of notifications created
    """
    notification_count = 0
    
    try:
        # Process each user and their suggestions
        for user_id, suggested_friends in suggestions_dict.items():
            for sender_id in suggested_friends:
                # Check if a suggestion notification already exists
                response = supabase.table('notifications').select('*').eq('user_id', user_id).eq('sender_id', sender_id).eq('type', 'suggestion').execute()
                
                # If no existing notification, create one
                if not response.data or len(response.data) == 0:
                    # Insert new notification
                    insert_response = supabase.table('notifications').insert({
                        'user_id': user_id,
                        'sender_id': sender_id,
                        'type': 'suggestion',
                        'is_read': False
                    }).execute()
                    
                    if hasattr(insert_response, 'error') and insert_response.error:
                        print(f"Error creating notification: {insert_response.error}")
                    else:
                        notification_count += 1
        
        return notification_count
    
    except Exception as e:
        print(f"Error creating suggestion notifications: {e}")
        return notification_count

# Example usage with test data
if __name__ == "__main__":
    # Original example with test data
    # new_edges = [(0,1),(0,3),(1,2),(2,5),(2,6),(2,7),(3,5),(3,4),(3,7),(5,7),(4,7)]
    # predicted_links = predict_new_links(new_edges)
    # print("Test prediction with sample data:")
    # print(predicted_links)
    
    # Get friend suggestions for all users
    all_suggestions = get_all_friend_suggestions()
    print("\nFriend suggestions for all users:")
    # Print first 5 users' suggestions as a sample
    sample_users = list(all_suggestions.keys())[:5] if len(all_suggestions) > 5 else all_suggestions.keys()
    for user_id in sample_users:
        print(f"User {user_id}: {all_suggestions[user_id]}")
    
    print(f"\nTotal users with suggestions: {len(all_suggestions)}")
    
    # Create notifications for the suggestions
    notifications_created = create_suggestion_notifications(all_suggestions)
    print(f"\nCreated {notifications_created} new suggestion notifications in the database")