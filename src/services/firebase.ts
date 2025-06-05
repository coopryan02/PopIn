import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, Event, Message, Conversation, Notification } from "@/types";

// Simulated backend storage for demo purposes
const STORAGE_PREFIX = "social_network_";

// Helper functions for local storage simulation
const getFromStorage = (key: string) => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (error) {
    console.error("Storage error:", error);
  }
};

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// User Management - Using local storage simulation for demo
export const createUserAccount = async (
  email: string,
  password: string,
  username: string,
  fullName: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    // Simulate checking if username exists
    const existingUsers = getFromStorage("users") || {};
    const userExists = Object.values(existingUsers).some(
      (user: any) => user.username.toLowerCase() === username.toLowerCase(),
    );

    if (userExists) {
      return { success: false, error: "Username already exists" };
    }

    // Check email exists
    const emailExists = Object.values(existingUsers).some(
      (user: any) => user.email.toLowerCase() === email.toLowerCase(),
    );

    if (emailExists) {
      return { success: false, error: "Email already exists" };
    }

    // Create user
    const userId = generateId();
    const userData: User = {
      id: userId,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      fullName,
      friends: [],
      friendRequests: {
        sent: [],
        received: [],
      },
      createdAt: new Date().toISOString(),
    };

    // Save user
    const users = getFromStorage("users") || {};
    users[userId] = userData;
    saveToStorage("users", users);

    // Save auth info
    const authData = getFromStorage("auth") || {};
    authData[email.toLowerCase()] = { password, userId };
    saveToStorage("auth", authData);

    console.log("User account created successfully:", userData);
    return { success: true, user: userData };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error.message || "Failed to create account",
    };
  }
};

export const signInUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const authData = getFromStorage("auth") || {};
    const userAuth = authData[email.toLowerCase()];

    if (!userAuth || userAuth.password !== password) {
      return { success: false, error: "Invalid email or password" };
    }

    const users = getFromStorage("users") || {};
    const userData = users[userAuth.userId];

    if (!userData) {
      return { success: false, error: "User data not found" };
    }

    console.log("User signed in successfully:", userData);
    return { success: true, user: userData };
  } catch (error: any) {
    console.error("Error signing in:", error);
    return {
      success: false,
      error: error.message || "Failed to sign in",
    };
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  // In a real app, this would get the current Firebase user
  // For demo, we'll return null since we're using local storage
  return null;
};

// Auth state listener - simulate with event
let authStateCallback: ((user: User | null) => void) | null = null;

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  authStateCallback = callback;
  // Immediately call with null for demo
  callback(null);

  // Return unsubscribe function
  return () => {
    authStateCallback = null;
  };
};

// Simulate auth state change
export const simulateAuthStateChange = (user: User | null) => {
  if (authStateCallback) {
    authStateCallback(user);
  }
};

// User Search and Friends
export const searchUsers = async (
  query: string,
  currentUserId: string,
): Promise<User[]> => {
  try {
    const users = getFromStorage("users") || {};
    const results: User[] = [];

    Object.values(users).forEach((userData: any) => {
      if (
        userData.id !== currentUserId &&
        (userData.username.toLowerCase().includes(query.toLowerCase()) ||
          userData.fullName.toLowerCase().includes(query.toLowerCase()) ||
          userData.email.toLowerCase().includes(query.toLowerCase()))
      ) {
        results.push(userData);
      }
    });

    return results;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string,
): Promise<boolean> => {
  try {
    const users = getFromStorage("users") || {};

    // Update sender's sent requests
    if (users[fromUserId]) {
      users[fromUserId].friendRequests.sent.push(toUserId);
    }

    // Update receiver's received requests
    if (users[toUserId]) {
      users[toUserId].friendRequests.received.push(fromUserId);
    }

    saveToStorage("users", users);

    // Create notification
    const notifications = getFromStorage("notifications") || {};
    const notificationId = generateId();
    notifications[notificationId] = {
      id: notificationId,
      userId: toUserId,
      type: "friend_request",
      title: "New Friend Request",
      message: "Someone sent you a friend request",
      data: { senderId: fromUserId },
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveToStorage("notifications", notifications);

    return true;
  } catch (error) {
    console.error("Error sending friend request:", error);
    return false;
  }
};

export const acceptFriendRequest = async (
  userId: string,
  requesterId: string,
): Promise<boolean> => {
  try {
    const users = getFromStorage("users") || {};

    // Update both users' friend lists
    if (users[userId]) {
      users[userId].friendRequests.received = users[
        userId
      ].friendRequests.received.filter((id: string) => id !== requesterId);
      users[userId].friends.push(requesterId);
    }

    if (users[requesterId]) {
      users[requesterId].friendRequests.sent = users[
        requesterId
      ].friendRequests.sent.filter((id: string) => id !== userId);
      users[requesterId].friends.push(userId);
    }

    saveToStorage("users", users);
    return true;
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return false;
  }
};

export const rejectFriendRequest = async (
  userId: string,
  requesterId: string,
): Promise<boolean> => {
  try {
    const users = getFromStorage("users") || {};

    if (users[userId]) {
      users[userId].friendRequests.received = users[
        userId
      ].friendRequests.received.filter((id: string) => id !== requesterId);
    }

    if (users[requesterId]) {
      users[requesterId].friendRequests.sent = users[
        requesterId
      ].friendRequests.sent.filter((id: string) => id !== userId);
    }

    saveToStorage("users", users);
    return true;
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return false;
  }
};

// Events Management
export const createEvent = async (
  event: Omit<Event, "id">,
): Promise<string | null> => {
  try {
    const eventId = generateId();
    const events = getFromStorage("events") || {};

    events[eventId] = {
      ...event,
      id: eventId,
      createdAt: new Date().toISOString(),
    };

    saveToStorage("events", events);

    // If it's a hangout, check for overlaps
    if (event.type === "hangout") {
      await checkForHangoutOverlaps(eventId, event);
    }

    return eventId;
  } catch (error) {
    console.error("Error creating event:", error);
    return null;
  }
};

export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const events = getFromStorage("events") || {};
    const userEvents: Event[] = [];

    Object.values(events).forEach((event: any) => {
      if (event.userId === userId) {
        userEvents.push(event);
      }
    });

    return userEvents.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  } catch (error) {
    console.error("Error getting user events:", error);
    return [];
  }
};

export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>,
): Promise<boolean> => {
  try {
    const events = getFromStorage("events") || {};
    if (events[eventId]) {
      events[eventId] = { ...events[eventId], ...updates };
      saveToStorage("events", events);
    }
    return true;
  } catch (error) {
    console.error("Error updating event:", error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const events = getFromStorage("events") || {};
    delete events[eventId];
    saveToStorage("events", events);
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
};

// Helper function to check for hangout overlaps
const checkForHangoutOverlaps = async (
  eventId: string,
  event: Omit<Event, "id">,
) => {
  try {
    const users = getFromStorage("users") || {};
    const events = getFromStorage("events") || {};
    const notifications = getFromStorage("notifications") || {};

    const userData = users[event.userId];
    if (!userData) return;

    const friends = userData.friends;

    // Get all friend hangouts
    for (const friendId of friends) {
      Object.values(events).forEach((friendEvent: any) => {
        if (friendEvent.userId === friendId && friendEvent.type === "hangout") {
          // Check for time overlap
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          const friendStart = new Date(friendEvent.startTime);
          const friendEnd = new Date(friendEvent.endTime);

          const overlapStart = new Date(
            Math.max(eventStart.getTime(), friendStart.getTime()),
          );
          const overlapEnd = new Date(
            Math.min(eventEnd.getTime(), friendEnd.getTime()),
          );

          if (overlapStart <= overlapEnd) {
            // Create hangout match notifications
            const overlap = {
              start: overlapStart.toISOString(),
              end: overlapEnd.toISOString(),
            };

            // Notify both users
            const notification1Id = generateId();
            notifications[notification1Id] = {
              id: notification1Id,
              userId: event.userId,
              type: "hangout_match",
              title: "Hangout Match Found!",
              message: "You have an overlapping hangout time with a friend",
              data: {
                matchedUserId: friendId,
                overlappingTime: overlap,
                hangoutEvents: [eventId, friendEvent.id],
              },
              read: false,
              createdAt: new Date().toISOString(),
            };

            const notification2Id = generateId();
            notifications[notification2Id] = {
              id: notification2Id,
              userId: friendId,
              type: "hangout_match",
              title: "Hangout Match Found!",
              message: "You have an overlapping hangout time with a friend",
              data: {
                matchedUserId: event.userId,
                overlappingTime: overlap,
                hangoutEvents: [eventId, friendEvent.id],
              },
              read: false,
              createdAt: new Date().toISOString(),
            };
          }
        }
      });
    }

    saveToStorage("notifications", notifications);
  } catch (error) {
    console.error("Error checking hangout overlaps:", error);
  }
};

// Messages
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
): Promise<boolean> => {
  try {
    const messages = getFromStorage("messages") || {};
    const messageId = generateId();
    const conversationId = [senderId, receiverId].sort().join("-");

    messages[messageId] = {
      id: messageId,
      senderId,
      receiverId,
      content,
      conversationId,
      timestamp: new Date().toISOString(),
      read: false,
    };

    saveToStorage("messages", messages);

    // Create notification for receiver
    const notifications = getFromStorage("notifications") || {};
    const notificationId = generateId();
    notifications[notificationId] = {
      id: notificationId,
      userId: receiverId,
      type: "message",
      title: "New Message",
      message: "You received a new message",
      data: { senderId },
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveToStorage("notifications", notifications);

    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
};

export const getConversationMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
) => {
  const getMessages = () => {
    const messages = getFromStorage("messages") || {};
    const conversationMessages: Message[] = [];

    Object.values(messages).forEach((message: any) => {
      if (message.conversationId === conversationId) {
        conversationMessages.push(message);
      }
    });

    conversationMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    callback(conversationMessages);
  };

  // Initial load
  getMessages();

  // Simulate real-time updates
  const interval = setInterval(getMessages, 1000);

  // Return unsubscribe function
  return () => clearInterval(interval);
};

// Notifications
export const getUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
) => {
  const getNotifications = () => {
    const notifications = getFromStorage("notifications") || {};
    const userNotifications: Notification[] = [];

    Object.values(notifications).forEach((notification: any) => {
      if (notification.userId === userId) {
        userNotifications.push(notification);
      }
    });

    userNotifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    callback(userNotifications.slice(0, 50));
  };

  // Initial load
  getNotifications();

  // Simulate real-time updates
  const interval = setInterval(getNotifications, 2000);

  // Return unsubscribe function
  return () => clearInterval(interval);
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<boolean> => {
  try {
    const notifications = getFromStorage("notifications") || {};
    if (notifications[notificationId]) {
      notifications[notificationId].read = true;
      saveToStorage("notifications", notifications);
    }
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};
