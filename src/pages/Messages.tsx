import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { MessagesList } from "@/components/messages/MessagesList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import { userStorage } from "@/utils/storage";
import { Conversation, User } from "@/types";

const Messages = () => {
  const { user } = useAuth();
  const { conversations, createConversation, getConversationWithUser } =
    useMessageStore(user?.id);
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Handle deep linking to a specific user conversation
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && user) {
      const users = userStorage.getUsers();
      const targetUser = users.find((u) => u.id === userId);

      if (targetUser && user.friends.includes(userId)) {
        // Check if conversation exists
        let conversation = getConversationWithUser(userId);

        // Create conversation if it doesn't exist
        if (!conversation) {
          conversation = createConversation(userId);
        }

        setSelectedConversation(conversation);
        setSelectedUser(targetUser);
        setShowMobileChat(true);
      }
    }
  }, [searchParams, user, getConversationWithUser, createConversation]);

  const handleConversationSelect = (
    conversation: Conversation,
    otherUser: User,
  ) => {
    setSelectedConversation(conversation);
    setSelectedUser(otherUser);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Chat with your friends</p>
          </div>
        </div>

        {/* Messages Interface */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-[600px]">
          {/* Conversations List - Hidden on mobile when chat is open */}
          <div
            className={`md:col-span-2 ${showMobileChat ? "hidden md:block" : "block"}`}
          >
            <MessagesList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onConversationSelect={handleConversationSelect}
            />
          </div>

          {/* Chat Window - Hidden on mobile when not selected */}
          <div
            className={`md:col-span-3 ${!showMobileChat ? "hidden md:block" : "block"}`}
          >
            <ChatWindow
              conversation={selectedConversation}
              otherUser={selectedUser}
              onBack={handleBackToList}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
