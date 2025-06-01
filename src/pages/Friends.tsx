import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { UserSearch } from "@/components/friends/UserSearch";
import { FriendRequestCard } from "@/components/friends/FriendRequestCard";
import { FriendsList } from "@/components/friends/FriendsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search } from "lucide-react";
import { useAuth } from "@/store/authStore";
import { userStorage } from "@/utils/storage";
import { User } from "@/types";

const Friends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);

  useEffect(() => {
    loadFriendsData();
  }, [user]);

  const loadFriendsData = () => {
    if (!user) return;

    const users = userStorage.getUsers();

    // Get friends
    const userFriends = user.friends
      .map((friendId) => users.find((u) => u.id === friendId))
      .filter(Boolean) as User[];

    // Get friend requests
    const requests = user.friendRequests.received
      .map((requesterId) => users.find((u) => u.id === requesterId))
      .filter(Boolean) as User[];

    setFriends(userFriends);
    setFriendRequests(requests);
  };

  const handleRequestHandled = () => {
    // Reload friends data after handling a request
    loadFriendsData();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
            <p className="text-muted-foreground">
              Connect with people and manage your social network
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="friends"
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Friends</span>
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Requests</span>
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Find Friends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-6">
            <FriendsList friends={friends} />
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <FriendRequestCard
              requests={friendRequests}
              onRequestHandled={handleRequestHandled}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <UserSearch />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Friends;
