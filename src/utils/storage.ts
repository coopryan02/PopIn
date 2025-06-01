import { User, Event, Message, Conversation, Notification } from "@/types";

const STORAGE_KEYS = {
  USERS: "social_network_users",
  CURRENT_USER: "social_network_current_user",
  EVENTS: "social_network_events",
  CONVERSATIONS: "social_network_conversations",
  NOTIFICATIONS: "social_network_notifications",
} as const;

// Generic storage utilities
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove from localStorage:", error);
    }
  },

  clear: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) =>
        localStorage.removeItem(key),
      );
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },
};

// User storage utilities
export const userStorage = {
  getUsers: (): User[] => storage.get<User[]>(STORAGE_KEYS.USERS) || [],

  setUsers: (users: User[]): void => storage.set(STORAGE_KEYS.USERS, users),

  getCurrentUser: (): User | null =>
    storage.get<User>(STORAGE_KEYS.CURRENT_USER),

  setCurrentUser: (user: User | null): void => {
    if (user) {
      storage.set(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      storage.remove(STORAGE_KEYS.CURRENT_USER);
    }
  },

  updateUser: (updatedUser: User): void => {
    const users = userStorage.getUsers();
    const index = users.findIndex((user) => user.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      userStorage.setUsers(users);

      // Update current user if it's the same user
      const currentUser = userStorage.getCurrentUser();
      if (currentUser?.id === updatedUser.id) {
        userStorage.setCurrentUser(updatedUser);
      }
    }
  },
};

// Event storage utilities
export const eventStorage = {
  getEvents: (): Event[] => storage.get<Event[]>(STORAGE_KEYS.EVENTS) || [],

  setEvents: (events: Event[]): void =>
    storage.set(STORAGE_KEYS.EVENTS, events),

  addEvent: (event: Event): void => {
    const events = eventStorage.getEvents();
    events.push(event);
    eventStorage.setEvents(events);
  },

  updateEvent: (updatedEvent: Event): void => {
    const events = eventStorage.getEvents();
    const index = events.findIndex((event) => event.id === updatedEvent.id);
    if (index !== -1) {
      events[index] = updatedEvent;
      eventStorage.setEvents(events);
    }
  },

  deleteEvent: (eventId: string): void => {
    const events = eventStorage.getEvents();
    const filteredEvents = events.filter((event) => event.id !== eventId);
    eventStorage.setEvents(filteredEvents);
  },
};

// Conversation storage utilities
export const conversationStorage = {
  getConversations: (): Conversation[] =>
    storage.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS) || [],

  setConversations: (conversations: Conversation[]): void =>
    storage.set(STORAGE_KEYS.CONVERSATIONS, conversations),

  addMessage: (message: Message): void => {
    const conversations = conversationStorage.getConversations();
    const conversationId = [message.senderId, message.receiverId]
      .sort()
      .join("-");

    let conversation = conversations.find((conv) => conv.id === conversationId);

    if (!conversation) {
      conversation = {
        id: conversationId,
        participants: [message.senderId, message.receiverId],
        messages: [],
        updatedAt: message.timestamp,
      };
      conversations.push(conversation);
    }

    conversation.messages.push(message);
    conversation.lastMessage = message;
    conversation.updatedAt = message.timestamp;

    conversationStorage.setConversations(conversations);
  },
};

// Notification storage utilities
export const notificationStorage = {
  getNotifications: (): Notification[] =>
    storage.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [],

  setNotifications: (notifications: Notification[]): void =>
    storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications),

  addNotification: (notification: Notification): void => {
    const notifications = notificationStorage.getNotifications();
    notifications.unshift(notification); // Add to beginning
    notificationStorage.setNotifications(notifications);
  },

  markAsRead: (notificationId: string): void => {
    const notifications = notificationStorage.getNotifications();
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notificationStorage.setNotifications(notifications);
    }
  },
};
