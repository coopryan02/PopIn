import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Calendar, Search } from "lucide-react";
import { User } from "@/types";
import { Link } from "react-router-dom";
import { useCalendarStore } from "@/store/calendarStore";
import { useAuth } from "@/store/authStore";

interface FriendsListProps {
  friends: User[];
}

export const FriendsList = ({ friends }: FriendsListProps) => {
  const { user } = useAuth();
  const { getFriendHangouts } = useCalendarStore(user?.id);
  const [searchFilter, setSearchFilter] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const getUpcomingHangouts = (friendId: string) => {
    const hangouts = getFriendHangouts(friendId);
    return hangouts.filter(
      (hangout) => new Date(hangout.startTime) > new Date(),
    ).length;
  };

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Your Friends</span>
          </CardTitle>
          <CardDescription>People you're connected with</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            You haven't added any friends yet. Use the search above to find
            people to connect with!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Your Friends ({friends.length})</span>
        </CardTitle>
        <CardDescription>People you're connected with</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Friends List */}
        <div className="space-y-3">
          {filteredFriends.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No friends match your search
            </p>
          ) : (
            filteredFriends.map((friend) => {
              const upcomingHangouts = getUpcomingHangouts(friend.id);

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.avatar} alt={friend.fullName} />
                      <AvatarFallback>
                        {getInitials(friend.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{friend.fullName}</p>
                        {upcomingHangouts > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {upcomingHangouts} hangout
                            {upcomingHangouts !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/messages?user=${friend.id}`}>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                    </Link>
                    <Link to={`/calendar/friend/${friend.id}`}>
                      <Button size="sm" variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Calendar
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
