import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserCheck, UserX } from "lucide-react";
import { User } from "@/types";
import { acceptFriendRequest, rejectFriendRequest } from "@/utils/auth";
import { useAuth } from "@/store/authStore";
import { toast } from "sonner";

interface FriendRequestCardProps {
  requests: User[];
  onRequestHandled: () => void;
}

export const FriendRequestCard = ({
  requests,
  onRequestHandled,
}: FriendRequestCardProps) => {
  const { user, updateUser } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAcceptRequest = (requesterId: string) => {
    if (!user) return;

    const success = acceptFriendRequest(user.id, requesterId);
    if (success) {
      // Update current user's state
      const updatedUser = {
        ...user,
        friends: [...user.friends, requesterId],
        friendRequests: {
          ...user.friendRequests,
          received: user.friendRequests.received.filter(
            (id) => id !== requesterId,
          ),
        },
      };
      updateUser(updatedUser);
      toast.success("Friend request accepted!");
      onRequestHandled();
    } else {
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = (requesterId: string) => {
    if (!user) return;

    const success = rejectFriendRequest(user.id, requesterId);
    if (success) {
      // Update current user's state
      const updatedUser = {
        ...user,
        friendRequests: {
          ...user.friendRequests,
          received: user.friendRequests.received.filter(
            (id) => id !== requesterId,
          ),
        },
      };
      updateUser(updatedUser);
      toast.success("Friend request rejected");
      onRequestHandled();
    } else {
      toast.error("Failed to reject friend request");
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Friend Requests</span>
          </CardTitle>
          <CardDescription>People who want to connect with you</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No pending friend requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Friend Requests ({requests.length})</span>
        </CardTitle>
        <CardDescription>People who want to connect with you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((requester) => (
          <div
            key={requester.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={requester.avatar} alt={requester.fullName} />
                <AvatarFallback>
                  {getInitials(requester.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{requester.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  @{requester.username}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleAcceptRequest(requester.id)}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectRequest(requester.id)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
