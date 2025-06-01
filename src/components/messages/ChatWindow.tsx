import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, ArrowLeft } from "lucide-react";
import { User, Conversation, Message } from "@/types";
import { useAuth } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversation: Conversation | null;
  otherUser: User | null;
  onBack?: () => void;
}

export const ChatWindow = ({
  conversation,
  otherUser,
  onBack,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const { sendMessage, markMessagesAsRead } = useMessageStore(user?.id);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  useEffect(() => {
    // Mark messages as read when conversation is opened
    if (conversation && user) {
      markMessagesAsRead(conversation.id);
    }
  }, [conversation, user, markMessagesAsRead]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUser || !user || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(otherUser.id, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  if (!conversation || !otherUser) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-center text-muted-foreground">
            Select a conversation to start messaging
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUser.avatar} alt={otherUser.fullName} />
            <AvatarFallback className="text-xs">
              {getInitials(otherUser.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{otherUser.fullName}</p>
            <p className="text-sm text-muted-foreground font-normal">
              @{otherUser.username}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <Separator />

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {conversation.messages.map((message: Message, index: number) => {
              const isFromUser = message.senderId === user?.id;
              const showAvatar =
                index === 0 ||
                conversation.messages[index - 1].senderId !== message.senderId;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end space-x-2",
                    isFromUser ? "justify-end" : "justify-start",
                  )}
                >
                  {!isFromUser && (
                    <Avatar
                      className={cn("h-6 w-6", !showAvatar && "invisible")}
                    >
                      <AvatarImage
                        src={otherUser.avatar}
                        alt={otherUser.fullName}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(otherUser.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "max-w-[70%] space-y-1",
                      isFromUser && "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm break-words",
                        isFromUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      {message.content}
                    </div>
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        isFromUser && "text-right",
                      )}
                    >
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>

                  {isFromUser && (
                    <Avatar
                      className={cn("h-6 w-6", !showAvatar && "invisible")}
                    >
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback className="text-xs">
                        {user ? getInitials(user.fullName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            placeholder={`Message ${otherUser.fullName}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
