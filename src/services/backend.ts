import { User, Event, Message, Notification } from "@/types";

// In-memory storage that simulates a real database
class BackendService {
  private users: Map<string, User> = new Map();
  private auth: Map<string, { password: string; userId: string }> = new Map();
  private events: Map<string, Event> = new Map();
  private messages: Map<string, Message> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private currentUser: User | null = null;

  // Generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // User Management
  async createUser(
    email: string,
    password: string,
    username: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      console.log("Creating user account...", { email, username, fullName });

      // Check if username exists
      const existingUser = Array.from(this.users.values()).find(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );
      if (existingUser) {
        return { success: false, error: "Username already exists" };
      }

      // Check if email exists
      if (this.auth.has(email.toLowerCase())) {
        return { success: false, error: "Email already exists" };
      }

      // Create user
      const userId = this.generateId();
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

      // Save user and auth data
      this.users.set(userId, userData);
      this.auth.set(email.toLowerCase(), { password, userId });

      console.log("User created successfully:", userData);
      return { success: true, user: userData };
    } catch (error: any) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: error.message || "Failed to create account",
      };
    }
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      console.log("Signing in user...", email);

      const authData = this.auth.get(email.toLowerCase());
      if (!authData || authData.password !== password) {
        return { success: false, error: "Invalid email or password" };
      }

      const user = this.users.get(authData.userId);
      if (!user) {
        return { success: false, error: "User data not found" };
      }

      this.currentUser = user;
      console.log("User signed in successfully:", user);
      return { success: true, user };
    } catch (error: any) {
      console.error("Error signing in:", error);
      return { success: false, error: error.message || "Failed to sign in" };
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    console.log("User signed out");
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Auth state listener simulation
  onAuthStateChange(callback: (user: User | null) => void) {
    // Immediately call with current user
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {};
  }

  // Search users
  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const results: User[] = [];

    this.users.forEach((user) => {
      if (
        user.id !== currentUserId &&
        (user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.fullName.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase()))
      ) {
        results.push(user);
      }
    });

    return results;
  }

  // Friend requests
  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<boolean> {
    try {
      const fromUser = this.users.get(fromUserId);
      const toUser = this.users.get(toUserId);

      if (!fromUser || !toUser) return false;

      // Update sender's sent requests
      fromUser.friendRequests.sent.push(toUserId);
      this.users.set(fromUserId, fromUser);

      // Update receiver's received requests
      toUser.friendRequests.received.push(fromUserId);
      this.users.set(toUserId, toUser);

      // Create notification
      const notificationId = this.generateId();
      const notification: Notification = {
        id: notificationId,
        userId: toUserId,
        type: "friend_request",
        title: "New Friend Request",
        message: "Someone sent you a friend request",
        data: { senderId: fromUserId },
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.notifications.set(notificationId, notification);

      return true;
    } catch (error) {
      console.error("Error sending friend request:", error);
      return false;
    }
  }

  async acceptFriendRequest(
    userId: string,
    requesterId: string,
  ): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      const requester = this.users.get(requesterId);

      if (!user || !requester) return false;

      // Update both users' friend lists
      user.friendRequests.received = user.friendRequests.received.filter(
        (id) => id !== requesterId,
      );
      user.friends.push(requesterId);
      this.users.set(userId, user);

      requester.friendRequests.sent = requester.friendRequests.sent.filter(
        (id) => id !== userId,
      );
      requester.friends.push(userId);
      this.users.set(requesterId, requester);

      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      return false;
    }
  }

  async rejectFriendRequest(
    userId: string,
    requesterId: string,
  ): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      const requester = this.users.get(requesterId);

      if (!user || !requester) return false;

      user.friendRequests.received = user.friendRequests.received.filter(
        (id) => id !== requesterId,
      );
      requester.friendRequests.sent = requester.friendRequests.sent.filter(
        (id) => id !== userId,
      );

      this.users.set(userId, user);
      this.users.set(requesterId, requester);

      return true;
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      return false;
    }
  }

  // Events
  async createEvent(event: Omit<Event, "id">): Promise<string | null> {
    try {
      const eventId = this.generateId();
      const eventData: Event = {
        ...event,
        id: eventId,
        createdAt: new Date().toISOString(),
      };

      this.events.set(eventId, eventData);

      // Check for hangout overlaps
      if (event.type === "hangout") {
        this.checkForHangoutOverlaps(eventId, event);
      }

      return eventId;
    } catch (error) {
      console.error("Error creating event:", error);
      return null;
    }
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    const userEvents: Event[] = [];

    this.events.forEach((event) => {
      if (event.userId === userId) {
        userEvents.push(event);
      }
    });

    return userEvents.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }

  async updateEvent(
    eventId: string,
    updates: Partial<Event>,
  ): Promise<boolean> {
    try {
      const event = this.events.get(eventId);
      if (event) {
        const updatedEvent = { ...event, ...updates };
        this.events.set(eventId, updatedEvent);
      }
      return true;
    } catch (error) {
      console.error("Error updating event:", error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      this.events.delete(eventId);
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }

  // Check for hangout overlaps
  private checkForHangoutOverlaps(eventId: string, event: Omit<Event, "id">) {
    try {
      const userData = this.users.get(event.userId);
      if (!userData) return;

      const friends = userData.friends;

      // Get all friend hangouts
      friends.forEach((friendId) => {
        this.events.forEach((friendEvent) => {
          if (
            friendEvent.userId === friendId &&
            friendEvent.type === "hangout"
          ) {
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
              const notification1Id = this.generateId();
              const notification1: Notification = {
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

              const notification2Id = this.generateId();
              const notification2: Notification = {
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

              this.notifications.set(notification1Id, notification1);
              this.notifications.set(notification2Id, notification2);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error checking hangout overlaps:", error);
    }
  }

  // Messages
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<boolean> {
    try {
      const messageId = this.generateId();
      const conversationId = [senderId, receiverId].sort().join("-");

      const message: Message = {
        id: messageId,
        senderId,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        read: false,
      };

      this.messages.set(messageId, message);

      // Create notification
      const notificationId = this.generateId();
      const notification: Notification = {
        id: notificationId,
        userId: receiverId,
        type: "message",
        title: "New Message",
        message: "You received a new message",
        data: { senderId },
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.notifications.set(notificationId, notification);

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  getConversationMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
  ) {
    const getMessages = () => {
      const conversationMessages: Message[] = [];

      this.messages.forEach((message) => {
        const msgConversationId = [message.senderId, message.receiverId]
          .sort()
          .join("-");
        if (msgConversationId === conversationId) {
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
  }

  // Notifications
  getUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
  ) {
    const getNotifications = () => {
      const userNotifications: Notification[] = [];

      this.notifications.forEach((notification) => {
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
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        notification.read = true;
        this.notifications.set(notificationId, notification);
      }
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }
}

// Create singleton instance
export const backendService = new BackendService();
