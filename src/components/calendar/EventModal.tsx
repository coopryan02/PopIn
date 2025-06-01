import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Calendar, Clock, MapPin, Plus, X } from "lucide-react";
import { CreateEventInput } from "@/types";
import { format } from "date-fns";

const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    type: z.enum(["personal", "hangout"]),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type EventFormData = z.infer<typeof eventSchema>;

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventData: CreateEventInput) => void;
  defaultDate?: Date;
}

export const EventModal = ({
  open,
  onOpenChange,
  onSubmit,
  defaultDate,
}: EventModalProps) => {
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>();
  const [maxTravelDistance, setMaxTravelDistance] = useState<
    number | undefined
  >();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: "personal",
      startTime: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : "",
      endTime: defaultDate
        ? format(
            new Date(defaultDate.getTime() + 60 * 60 * 1000),
            "yyyy-MM-dd'T'HH:mm",
          )
        : "",
    },
  });

  const watchedType = watch("type");

  const handleEventSubmit = (data: EventFormData) => {
    const eventData: CreateEventInput = {
      title: data.title,
      description: data.description,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      type: data.type,
    };

    if (data.type === "hangout") {
      eventData.preferences = {
        activitySuggestions,
        budgetLimit,
        maxTravelDistance,
      };
    }

    onSubmit(eventData);
    handleClose();
  };

  const handleClose = () => {
    reset();
    setActivitySuggestions([]);
    setNewActivity("");
    setBudgetLimit(undefined);
    setMaxTravelDistance(undefined);
    onOpenChange(false);
  };

  const addActivity = () => {
    if (
      newActivity.trim() &&
      !activitySuggestions.includes(newActivity.trim())
    ) {
      setActivitySuggestions([...activitySuggestions, newActivity.trim()]);
      setNewActivity("");
    }
  };

  const removeActivity = (activity: string) => {
    setActivitySuggestions(activitySuggestions.filter((a) => a !== activity));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addActivity();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to your calendar. Choose "hangout" type to find
            friends with overlapping availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleEventSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Basic Event Info */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="Enter event title"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add event description"
                {...register("description")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={watchedType}
                onValueChange={(value) =>
                  setValue("type", value as "personal" | "hangout")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Personal Event</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hangout">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Hangout</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                  className={errors.startTime ? "border-red-500" : ""}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                  className={errors.endTime ? "border-red-500" : ""}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Hangout Preferences */}
            {watchedType === "hangout" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Hangout Preferences</span>
                  </h3>

                  {/* Activity Suggestions */}
                  <div className="space-y-2">
                    <Label>Activity Suggestions</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add activity (e.g., coffee, movie, park)"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Button type="button" onClick={addActivity} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {activitySuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activitySuggestions.map((activity, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{activity}</span>
                            <button
                              type="button"
                              onClick={() => removeActivity(activity)}
                              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Budget Limit */}
                  <div className="space-y-2">
                    <Label htmlFor="budgetLimit">Budget Limit (Optional)</Label>
                    <Input
                      id="budgetLimit"
                      type="number"
                      placeholder="Enter budget in dollars"
                      value={budgetLimit || ""}
                      onChange={(e) =>
                        setBudgetLimit(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Max Travel Distance */}
                  <div className="space-y-2">
                    <Label htmlFor="maxTravelDistance">
                      Max Travel Distance (Optional)
                    </Label>
                    <Input
                      id="maxTravelDistance"
                      type="number"
                      placeholder="Enter distance in miles"
                      value={maxTravelDistance || ""}
                      onChange={(e) =>
                        setMaxTravelDistance(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
