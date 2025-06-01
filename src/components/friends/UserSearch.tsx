import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserCheck, Clock } from "lucide-react";
import { User } from "@/types";
import { searchUsers, sendFriendRequest } from "@/utils/auth";
import { useAuth } from "@/store/authStore";
import { toast } from "sonner";

export const UserSearch = () => {
  const { user, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim() && user) {
        setIsSearching(true);
        const results = searchUsers(searchQuery, user.id);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFriendshipStatus = (otherUser: User) => {
    if (!user) return "none";

    if (user.friends.includes(otherUser.id)) {
      return "friends";
    }

    if (user.friendRequests.sent.includes(otherUser.id)) {
      return "pending";
    }

    if (user.friendRequests.received.includes(otherUser.id)) {
      return "received";
    }

    return "none";
  };

  const handleSendFriendRequest = (otherUserId: string) => {
    if (!user) return;

    const success = sendFriendRequest(user.id, otherUserId);
    if (success) {
      // Update current user's sent requests
      const updatedUser = {
        ...user,
        friendRequests: {
          ...user.friendRequests,
          sent: [...user.friendRequests.sent, otherUserId],
        },
      };
      updateUser(updatedUser);
      toast.success("Friend request sent!");
    } else {
      toast.error("Failed to send friend request");
    }
  };

  const renderActionButton = (otherUser: User) => {
    const status = getFriendshipStatus(otherUser);

    switch (status) {
      case "friends":
        return (
          <Button variant="secondary" size="sm" disabled>
            <UserCheck className="mr-2 h-4 w-4" />
            Friends
          </Button>
        );
      case "pending":
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="mr-2 h-4 w-4" />
            Pending
          </Button>
        );
      case "received":
        return <Badge variant="secondary">Sent you a request</Badge>;
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleSendFriendRequest(otherUser.id)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Find Friends</span>
        </CardTitle>
        <CardDescription>
          Search for users by name, username, or email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isSearching && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {searchQuery && !isSearching && searchResults.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No users found matching "{searchQuery}"
          </p>
        )}

        <div className="space-y-3">
          {searchResults.map((searchUser) => (
            <div
              key={searchUser.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={searchUser.avatar}
                    alt={searchUser.fullName}
                  />
                  <AvatarFallback>
                    {getInitials(searchUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{searchUser.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{searchUser.username}
                  </p>
                </div>
              </div>
              {renderActionButton(searchUser)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
