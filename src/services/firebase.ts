import { User, Event, Message, Notification } from "@/types";
import { backendService } from "./backend";

// User Management - Now using working backend service
export const createUserAccount = async (
  email: string,
  password: string,
  username: string,
  fullName: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  return backendService.createUser(email, password, username, fullName);
};

export const signInUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  return backendService.signIn(email, password);
};

export const signOutUser = async (): Promise<void> => {
  return backendService.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  return backendService.getCurrentUser();
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return backendService.onAuthStateChange(callback);
};

// User Search and Friends
export const searchUsers = async (
  query: string,
  currentUserId: string,
): Promise<User[]> => {
  return backendService.searchUsers(query, currentUserId);
};

export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string,
): Promise<boolean> => {
  return backendService.sendFriendRequest(fromUserId, toUserId);
};

export const acceptFriendRequest = async (
  userId: string,
  requesterId: string,
): Promise<boolean> => {
  return backendService.acceptFriendRequest(userId, requesterId);
};

export const rejectFriendRequest = async (
  userId: string,
  requesterId: string,
): Promise<boolean> => {
  return backendService.rejectFriendRequest(userId, requesterId);
};

// Events Management
export const createEvent = async (
  event: Omit<Event, "id">,
): Promise<string | null> => {
  return backendService.createEvent(event);
};

export const getUserEvents = async (userId: string): Promise<Event[]> => {
  return backendService.getUserEvents(userId);
};

export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>,
): Promise<boolean> => {
  return backendService.updateEvent(eventId, updates);
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  return backendService.deleteEvent(eventId);
};

// Messages
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
): Promise<boolean> => {
  return backendService.sendMessage(senderId, receiverId, content);
};

export const getConversationMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
) => {
  return backendService.getConversationMessages(conversationId, callback);
};

// Notifications
export const getUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
) => {
  return backendService.getUserNotifications(userId, callback);
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<boolean> => {
  return backendService.markNotificationAsRead(notificationId);
};
