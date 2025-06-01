import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  MessageCircle,
} from "lucide-react";
import { HangoutEvent, User } from "@/types";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Link } from "react-router-dom";

interface FriendHangoutsProps {
  friendHangouts: Array<{ event: HangoutEvent; friend: User }>;
}

export const FriendHangouts = ({ friendHangouts }: FriendHangoutsProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isToday(start)) {
      return `Today ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
    } else if (isTomorrow(start)) {
      return `Tomorrow ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
    } else if (isThisWeek(start)) {
      return `${format(start, "EEEE h:mm a")} - ${format(end, "h:mm a")}`;
    } else {
      return `${format(start, "MMM d, h:mm a")} - ${format(end, "h:mm a")}`;
    }
  };

  const upcomingHangouts = friendHangouts.filter(
    ({ event }) => new Date(event.startTime) > new Date(),
  );

  if (upcomingHangouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Friends' Hangouts</span>
          </CardTitle>
          <CardDescription>See what your friends are planning</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            None of your friends have upcoming hangouts planned
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Friends' Hangouts ({upcomingHangouts.length})</span>
        </CardTitle>
        <CardDescription>
          See what your friends are planning and join them!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingHangouts.slice(0, 5).map(({ event, friend }) => (
          <div key={event.id} className="border rounded-lg p-4 space-y-3">
            {/* Friend Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.avatar} alt={friend.fullName} />
                  <AvatarFallback>
                    {getInitials(friend.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{friend.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{friend.username}
                  </p>
                </div>
              </div>
              <Link to={`/messages?user=${friend.id}`}>
                <Button size="sm" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </Link>
            </div>

            {/* Event Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>{event.title}</span>
                </h4>
                <Badge variant="secondary">Hangout</Badge>
              </div>

              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatEventTime(event.startTime, event.endTime)}</span>
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>

            {/* Hangout Preferences */}
            {event.preferences && (
              <div className="space-y-2 pt-2 border-t">
                {event.preferences.activitySuggestions &&
                  event.preferences.activitySuggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Activities:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.preferences.activitySuggestions
                          .slice(0, 3)
                          .map((activity, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {activity}
                            </Badge>
                          ))}
                        {event.preferences.activitySuggestions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.preferences.activitySuggestions.length - 3}{" "}
                            more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex space-x-4 text-sm text-muted-foreground">
                  {event.preferences.budgetLimit && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Budget: ${event.preferences.budgetLimit}</span>
                    </div>
                  )}

                  {event.preferences.maxTravelDistance && (
                    <div className="flex items-center space-x-1">
                      <Navigation className="h-3 w-3" />
                      <span>
                        Max travel: {event.preferences.maxTravelDistance} miles
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {upcomingHangouts.length > 5 && (
          <div className="text-center pt-2">
            <Link to="/friend-hangouts">
              <Button variant="outline" size="sm">
                View All {upcomingHangouts.length} Hangouts
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
