import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  MessageCircle,
  Users,
  Calendar,
} from "lucide-react";
import { HangoutEvent, User } from "@/types";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface HangoutOverlapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEvent: HangoutEvent | null;
  friendEvent: HangoutEvent | null;
  friend: User | null;
  overlapTime: { start: string; end: string } | null;
}

export const HangoutOverlapModal = ({
  open,
  onOpenChange,
  userEvent,
  friendEvent,
  friend,
  overlapTime,
}: HangoutOverlapModalProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatOverlapTime = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "Invalid time range";
      }

      return `${format(startDate, "MMM d, h:mm a")} - ${format(endDate, "h:mm a")}`;
    } catch (error) {
      return "Invalid time range";
    }
  };

  const renderHangoutPreferences = (event: HangoutEvent, title: string) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="space-y-2 ml-7">
        <div>
          <p className="font-medium">{event.title}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(event.startTime), "MMM d, h:mm a")} -{" "}
            {format(new Date(event.endTime), "h:mm a")}
          </p>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {event.description}
            </p>
          )}
        </div>

        {event.preferences && (
          <>
            {event.preferences.activitySuggestions &&
              event.preferences.activitySuggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Activity Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {event.preferences.activitySuggestions.map(
                      (activity, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {activity}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}

            <div className="flex space-x-4 text-sm">
              {event.preferences.budgetLimit && (
                <div className="flex items-center space-x-1 text-green-600">
                  <DollarSign className="h-3 w-3" />
                  <span>Budget: ${event.preferences.budgetLimit}</span>
                </div>
              )}

              {event.preferences.maxTravelDistance && (
                <div className="flex items-center space-x-1 text-purple-600">
                  <Navigation className="h-3 w-3" />
                  <span>
                    Max travel: {event.preferences.maxTravelDistance} miles
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!userEvent || !friendEvent || !friend || !overlapTime) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span>Hangout Overlap Found!</span>
          </DialogTitle>
          <DialogDescription>
            You and {friend.fullName} have overlapping hangout times. Here are
            the details and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Friend Info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={friend.avatar} alt={friend.fullName} />
                <AvatarFallback>{getInitials(friend.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{friend.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  @{friend.username}
                </p>
              </div>
            </div>
            <Link to={`/messages?user=${friend.id}`}>
              <Button size="sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
            </Link>
          </div>

          {/* Overlap Time */}
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-800">Overlapping Time</p>
            </div>
            <p className="text-green-700">
              {formatOverlapTime(overlapTime.start, overlapTime.end)}
            </p>
          </div>

          {/* Your Hangout */}
          {renderHangoutPreferences(userEvent, "Your Hangout Plans")}

          <Separator />

          {/* Friend's Hangout */}
          {renderHangoutPreferences(
            friendEvent,
            `${friend.fullName}'s Hangout Plans`,
          )}

          {/* Compatibility Check */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Compatibility Analysis</span>
            </h4>
            <div className="space-y-2 text-sm">
              {/* Activity Compatibility */}
              {userEvent.preferences?.activitySuggestions &&
                friendEvent.preferences?.activitySuggestions && (
                  <div>
                    <p className="font-medium">Common Activities:</p>
                    {(() => {
                      const commonActivities =
                        userEvent.preferences.activitySuggestions.filter(
                          (activity) =>
                            friendEvent.preferences?.activitySuggestions?.includes(
                              activity,
                            ),
                        );

                      if (commonActivities.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {commonActivities.map((activity, index) => (
                              <Badge
                                key={index}
                                variant="default"
                                className="text-xs bg-green-600"
                              >
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <p className="text-muted-foreground">
                            No common activities, but that's okay - you can try
                            something new!
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}

              {/* Budget Compatibility */}
              {userEvent.preferences?.budgetLimit &&
                friendEvent.preferences?.budgetLimit && (
                  <div>
                    <p className="font-medium">Budget Range:</p>
                    <p className="text-muted-foreground">
                      $
                      {Math.min(
                        userEvent.preferences.budgetLimit,
                        friendEvent.preferences.budgetLimit,
                      )}{" "}
                      - $
                      {Math.max(
                        userEvent.preferences.budgetLimit,
                        friendEvent.preferences.budgetLimit,
                      )}
                    </p>
                  </div>
                )}

              {/* Travel Compatibility */}
              {userEvent.preferences?.maxTravelDistance &&
                friendEvent.preferences?.maxTravelDistance && (
                  <div>
                    <p className="font-medium">Travel Range:</p>
                    <p className="text-muted-foreground">
                      Both willing to travel up to{" "}
                      {Math.min(
                        userEvent.preferences.maxTravelDistance,
                        friendEvent.preferences.maxTravelDistance,
                      )}{" "}
                      miles
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Action Suggestions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">
              💡 Suggestions
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Message {friend.fullName} to coordinate your plans</li>
              <li>• Consider combining your hangout ideas</li>
              <li>• Meet somewhere in the middle if travel distance allows</li>
              <li>• Share activity suggestions to find common interests</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Link to={`/messages?user=${friend.id}`}>
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              Start Planning Together
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
