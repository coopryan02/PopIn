import { useState, useEffect, useCallback } from "react";
import { Message, Conversation, User, Notification } from "@/types";
import {
  conversationStorage,
  userStorage,
  notificationStorage,
} from "@/utils/storage";
import { generateId } from "@/utils/auth";

export const useMessageStore = (userId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(() => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const allConversations = conversationStorage.getConversations();
    const userConversations = allConversations.filter((conv) =>
      conv.participants.includes(userId),
    );

    // Sort by last message timestamp
    userConversations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    setConversations(userConversations);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const sendMessage = (receiverId: string, content: string): Message => {
    if (!userId) throw new Error("User ID is required");

    const message: Message = {
      id: generateId(),
      senderId: userId,
      receiverId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    conversationStorage.addMessage(message);
    loadConversations(); // Refresh conversations

    // Create notification for receiver
    const sender = userStorage.getUsers().find((u) => u.id === userId);
    if (sender) {
      const notification: Notification = {
        id: generateId(),
        userId: receiverId,
        type: "message",
        title: "New Message",
        message: `${sender.fullName} sent you a message`,
        data: {
          senderId: userId,
          messageId: message.id,
        },
        read: false,
        createdAt: new Date().toISOString(),
      };

      notificationStorage.addNotification(notification);
    }

    return message;
  };

  const getConversation = (participantId: string): Conversation | null => {
    if (!userId) return null;

    return (
      conversations.find(
        (conv) =>
          conv.participants.includes(participantId) &&
          conv.participants.includes(userId),
      ) || null
    );
  };

  const markMessagesAsRead = (conversationId: string): void => {
    const conversation = conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation) return;

    let hasUnreadMessages = false;
    const updatedMessages = conversation.messages.map((message) => {
      if (message.receiverId === userId && !message.read) {
        hasUnreadMessages = true;
        return { ...message, read: true };
      }
      return message;
    });

    if (hasUnreadMessages) {
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
      };

      const allConversations = conversationStorage.getConversations();
      const updatedConversations = allConversations.map((conv) =>
        conv.id === conversationId ? updatedConversation : conv,
      );

      conversationStorage.setConversations(updatedConversations);
      loadConversations();
    }
  };

  const getUnreadCount = (conversationId: string): number => {
    const conversation = conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation) return 0;

    return conversation.messages.filter(
      (message) => message.receiverId === userId && !message.read,
    ).length;
  };

  const getTotalUnreadCount = (): number => {
    return conversations.reduce(
      (total, conversation) => total + getUnreadCount(conversation.id),
      0,
    );
  };

  const deleteConversation = (conversationId: string): boolean => {
    const conversation = conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation || !conversation.participants.includes(userId!)) {
      return false;
    }

    const allConversations = conversationStorage.getConversations();
    const updatedConversations = allConversations.filter(
      (conv) => conv.id !== conversationId,
    );

    conversationStorage.setConversations(updatedConversations);
    loadConversations();

    return true;
  };

  const getConversationWithUser = (
    otherUserId: string,
  ): Conversation | null => {
    if (!userId) return null;

    const conversationId = [userId, otherUserId].sort().join("-");
    return conversations.find((conv) => conv.id === conversationId) || null;
  };

  const createConversation = (otherUserId: string): Conversation => {
    if (!userId) throw new Error("User ID is required");

    const conversationId = [userId, otherUserId].sort().join("-");

    const newConversation: Conversation = {
      id: conversationId,
      participants: [userId, otherUserId],
      messages: [],
      updatedAt: new Date().toISOString(),
    };

    const allConversations = conversationStorage.getConversations();
    allConversations.push(newConversation);
    conversationStorage.setConversations(allConversations);

    loadConversations();
    return newConversation;
  };

  return {
    conversations,
    isLoading,
    sendMessage,
    getConversation,
    markMessagesAsRead,
    getUnreadCount,
    getTotalUnreadCount,
    deleteConversation,
    getConversationWithUser,
    createConversation,
    loadConversations,
  };
};
