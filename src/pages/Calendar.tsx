import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventModal } from "@/components/calendar/EventModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  DollarSign,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useCalendarStore } from "@/store/calendarStore";
import { Event, HangoutEvent, CreateEventInput } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";

const Calendar = () => {
  const { user } = useAuth();
  const {
    events,
    createEvent,
    deleteEvent,
    getOverlappingHangouts,
    checkEventOverlap,
  } = useCalendarStore(user?.id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCreateEvent = (eventData: CreateEventInput) => {
    try {
      const newEvent = createEvent(eventData);
      toast.success(
        `${eventData.type === "hangout" ? "Hangout" : "Event"} created successfully!`,
      );

      if (eventData.type === "hangout") {
        toast.info("Checking for friend matches...", {
          description:
            "You'll be notified if any friends have overlapping hangout times.",
        });
      }
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      const success = deleteEvent(selectedEvent.id);
      if (success) {
        toast.success("Event deleted successfully");
        setShowEventDetails(false);
        setSelectedEvent(null);
      } else {
        toast.error("Failed to delete event");
      }
    }
  };

  const renderEventDetails = (event: Event) => {
    const isHangout = event.type === "hangout";
    const hangoutEvent = isHangout ? (event as HangoutEvent) : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          {isHangout ? (
            <MapPin className="h-5 w-5 text-blue-600" />
          ) : (
            <CalendarIcon className="h-5 w-5 text-gray-600" />
          )}
          <h3 className="text-lg font-semibold">{event.title}</h3>
          <Badge variant={isHangout ? "default" : "secondary"}>
            {isHangout ? "Hangout" : "Personal"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(event.startTime), "MMM d, yyyy h:mm a")} -{" "}
              {format(new Date(event.endTime), "h:mm a")}
            </span>
          </div>

          {event.description && (
            <div className="text-sm">
              <p className="font-medium mb-1">Description:</p>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}
        </div>

        {isHangout && hangoutEvent?.preferences && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Hangout Preferences</h4>

              {hangoutEvent.preferences.activitySuggestions &&
                hangoutEvent.preferences.activitySuggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Activity Suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hangoutEvent.preferences.activitySuggestions.map(
                        (activity, index) => (
                          <Badge key={index} variant="outline">
                            {activity}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {hangoutEvent.preferences.budgetLimit && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    Budget limit: ${hangoutEvent.preferences.budgetLimit}
                  </span>
                </div>
              )}

              {hangoutEvent.preferences.maxTravelDistance && (
                <div className="flex items-center space-x-2 text-sm">
                  <Navigation className="h-4 w-4" />
                  <span>
                    Max travel: {hangoutEvent.preferences.maxTravelDistance}{" "}
                    miles
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              Manage your events and hangouts
            </p>
          </div>
          <Button onClick={() => setShowEventModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Calendar Component */}
        <CalendarView
          events={events}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          getOverlappingHangouts={getOverlappingHangouts}
          checkEventOverlap={checkEventOverlap}
          selectedDate={selectedDate}
        />

        {/* Event Creation Modal */}
        <EventModal
          open={showEventModal}
          onOpenChange={setShowEventModal}
          onSubmit={handleCreateEvent}
          defaultDate={selectedDate}
        />

        {/* Event Details Modal */}
        <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>View and manage your event</DialogDescription>
            </DialogHeader>

            {selectedEvent && renderEventDetails(selectedEvent)}

            <DialogFooter className="flex justify-between">
              <Button variant="destructive" onClick={handleDeleteEvent}>
                Delete Event
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEventDetails(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Calendar;
