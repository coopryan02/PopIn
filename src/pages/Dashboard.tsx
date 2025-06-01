import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MessageCircle,
  Users,
  Plus,
  Clock,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useCalendarStore } from "@/store/calendarStore";
import { useMessageStore } from "@/store/messageStore";
import { useNotificationStore } from "@/store/notificationStore";
import { userStorage } from "@/utils/storage";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const { events, getHangoutMatches, getAllFriendHangouts } = useCalendarStore(
    user?.id,
  );
  const { conversations, getTotalUnreadCount } = useMessageStore(user?.id);
  const { notifications, getUnreadCount } = useNotificationStore(user?.id);

  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const friendHangouts = getAllFriendHangouts();

  useEffect(() => {
    if (user) {
      const users = userStorage.getUsers();
      const requests = user.friendRequests.received
        .map((requesterId) => users.find((u) => u.id === requesterId))
        .filter(Boolean);
      setFriendRequests(requests);
    }
  }, [user]);

  const upcomingEvents = events
    .filter((event) => new Date(event.startTime) > new Date())
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    .slice(0, 3);

  const recentConversations = conversations.slice(0, 3);
  const hangoutMatches = getHangoutMatches().slice(0, 2);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOtherParticipant = (conversation: any) => {
    const otherUserId = conversation.participants.find(
      (id: string) => id !== user?.id,
    );
    const users = userStorage.getUsers();
    return users.find((u) => u.id === otherUserId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your social network
            </p>
          </div>
          <Link to="/calendar">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unread Messages
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalUnreadCount()}</div>
              <p className="text-xs text-muted-foreground">
                From {conversations.length} conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Friends</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.friends.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {friendRequests.length} pending requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Friends' Hangouts
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  friendHangouts.filter(
                    ({ event }) => new Date(event.startTime) > new Date(),
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Upcoming plans</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your next scheduled activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming events.{" "}
                  <Link to="/calendar" className="text-primary hover:underline">
                    Create one
                  </Link>
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {event.type === "hangout" ? (
                          <MapPin className="h-5 w-5 text-primary" />
                        ) : (
                          <Calendar className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">
                          {event.title}
                        </p>
                        {event.type === "hangout" && (
                          <Badge variant="secondary" className="text-xs">
                            Hangout
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(event.startTime), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {upcomingEvents.length > 0 && (
                <Link to="/calendar">
                  <Button variant="outline" className="w-full">
                    View All Events
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentConversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No conversations yet.{" "}
                  <Link to="/friends" className="text-primary hover:underline">
                    Find friends
                  </Link>
                </p>
              ) : (
                recentConversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  if (!otherUser) return null;

                  return (
                    <div
                      key={conversation.id}
                      className="flex items-center space-x-4"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={otherUser.avatar}
                          alt={otherUser.fullName}
                        />
                        <AvatarFallback>
                          {getInitials(otherUser.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {otherUser.fullName}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {/* Unread count */}
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(conversation.updatedAt), "MMM d")}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
              {recentConversations.length > 0 && (
                <Link to="/messages">
                  <Button variant="outline" className="w-full">
                    View All Messages
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Friends' Hangouts - Always visible */}
        <FriendHangouts friendHangouts={friendHangouts} />

        {/* Friend Requests & Hangout Matches */}
        {(friendRequests.length > 0 || hangoutMatches.length > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Friend Requests</CardTitle>
                  <CardDescription>
                    People who want to connect with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {friendRequests.slice(0, 3).map((requester) => (
                    <div
                      key={requester.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={requester.avatar}
                            alt={requester.fullName}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(requester.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {requester.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{requester.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Link to="/friends">
                    <Button variant="outline" className="w-full">
                      View All Requests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Hangout Matches */}
            {hangoutMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hangout Matches</CardTitle>
                  <CardDescription>
                    Friends with overlapping hangout times
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hangoutMatches.map((match) => {
                    const otherUserId = match.users.find(
                      (id) => id !== user?.id,
                    );
                    const otherUser = userStorage
                      .getUsers()
                      .find((u) => u.id === otherUserId);
                    if (!otherUser) return null;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={otherUser.avatar}
                              alt={otherUser.fullName}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(otherUser.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {otherUser.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(match.overlappingTime.start),
                                "MMM d, h:mm a",
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
