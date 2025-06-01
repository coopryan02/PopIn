import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, MessageCircle, MapPin } from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useCalendarStore } from "@/store/calendarStore";
import { format } from "date-fns";

const Profile = () => {
  const { user } = useAuth();
  const { events } = useCalendarStore(user?.id);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const upcomingEvents = events.filter(
    (event) => new Date(event.startTime) > new Date(),
  );
  const hangoutEvents = events.filter((event) => event.type === "hangout");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Info */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4">{user.fullName}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {user.friends.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Friends</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{events.length}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {hangoutEvents.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Hangouts
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Account Info</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>Email: {user.email}</p>
                    <p>
                      Member since:{" "}
                      {format(new Date(user.createdAt), "MMM yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Events</span>
                </CardTitle>
                <CardDescription>
                  Your next scheduled activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming events
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            {event.type === "hangout" ? (
                              <MapPin className="h-4 w-4 text-primary" />
                            ) : (
                              <Calendar className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(event.startTime),
                                "MMM d, h:mm a",
                              )}
                            </p>
                          </div>
                        </div>
                        {event.type === "hangout" && (
                          <Badge variant="secondary">Hangout</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your social network activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Joined {user.friends.length} friends</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>Created {events.length} events</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span>Planned {hangoutEvents.length} hangouts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
