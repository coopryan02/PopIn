import { useState } from "react";
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
import { Search, MessageCircle } from "lucide-react";
import { Conversation, User } from "@/types";
import { userStorage } from "@/utils/storage";
import { useAuth } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface MessagesListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation, otherUser: User) => void;
}

export const MessagesList = ({
  conversations,
  selectedConversation,
  onConversationSelect,
}: MessagesListProps) => {
  const { user } = useAuth();
  const { getUnreadCount } = useMessageStore(user?.id);
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOtherParticipant = (conversation: Conversation): User | null => {
    const otherUserId = conversation.participants.find(
      (id: string) => id !== user?.id,
    );
    const users = userStorage.getUsers();
    return users.find((u) => u.id === otherUserId) || null;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = getOtherParticipant(conversation);
    if (!otherUser) return false;

    return (
      otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage?.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  });

  if (conversations.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Messages</span>
          </CardTitle>
          <CardDescription>Your conversations will appear here</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Start messaging your friends!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Messages</span>
        </CardTitle>
        <CardDescription>
          {conversations.length} conversation
          {conversations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="max-h-[500px] overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations match your search
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              if (!otherUser) return null;

              const unreadCount = getUnreadCount(conversation.id);
              const isSelected = selectedConversation?.id === conversation.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation, otherUser)}
                  className={cn(
                    "flex items-center space-x-3 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected && "bg-muted",
                  )}
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
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {otherUser.fullName}
                      </p>
                      <div className="flex items-center space-x-1">
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatLastMessageTime(
                              conversation.lastMessage.timestamp,
                            )}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {conversation.lastMessage ? (
                      <p
                        className={cn(
                          "text-sm truncate",
                          unreadCount > 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {conversation.lastMessage.senderId === user?.id
                          ? "You: "
                          : ""}
                        {conversation.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No messages yet
                      </p>
                    )}
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
