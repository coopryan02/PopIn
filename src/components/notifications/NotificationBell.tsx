import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Check,
  X,
  UserPlus,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { userStorage } from "@/utils/storage";
import { acceptFriendRequest, rejectFriendRequest } from "@/utils/auth";
import { format } from "date-fns";
import { toast } from "sonner";

export const NotificationBell = () => {
  const { user, updateUser } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore(
    user?.id,
  );
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAcceptFriendRequest = async (
    requesterId: string,
    notificationId: string,
  ) => {
    if (!user) return;

    const success = acceptFriendRequest(user.id, requesterId);
    if (success) {
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
      markAsRead(notificationId);
      toast.success("Friend request accepted!");
    }
  };

  const handleRejectFriendRequest = async (
    requesterId: string,
    notificationId: string,
  ) => {
    if (!user) return;

    const success = rejectFriendRequest(user.id, requesterId);
    if (success) {
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
      markAsRead(notificationId);
      toast.success("Friend request rejected");
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "hangout_match":
        return <Calendar className="h-4 w-4 text-green-600" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const renderNotificationContent = (notification: any) => {
    const users = userStorage.getUsers();

    if (notification.type === "friend_request") {
      const requester = users.find((u) => u.id === notification.data?.senderId);
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {requester && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={requester.avatar} alt={requester.fullName} />
                <AvatarFallback className="text-xs">
                  {getInitials(requester.fullName)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-xs text-muted-foreground">
                {notification.message}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={() =>
                handleAcceptFriendRequest(
                  notification.data.senderId,
                  notification.id,
                )
              }
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={() =>
                handleRejectFriendRequest(
                  notification.data.senderId,
                  notification.id,
                )
              }
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="text-xs text-muted-foreground">{notification.message}</p>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
            <CardDescription>
              {notifications.length === 0
                ? "No notifications"
                : `${unreadCount} unread`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No notifications yet
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${!notification.read ? "bg-blue-50 border-blue-200" : "bg-background"}`}
                    onClick={() =>
                      !notification.read && markAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {renderNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {renderNotificationContent(notification)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(notification.createdAt),
                            "MMM d, h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
