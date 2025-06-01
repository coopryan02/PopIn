export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  friends: string[];
  friendRequests: {
    sent: string[];
    received: string[];
  };
  createdAt: string;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: "personal" | "hangout";
  createdAt: string;
}

export interface HangoutEvent extends Event {
  type: "hangout";
  preferences: {
    activitySuggestions: string[];
    budgetLimit?: number;
    maxTravelDistance?: number;
  };
  visibility: "friends"; // Only friends can see hangout details
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "friend_request" | "hangout_match" | "message";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface HangoutMatch {
  id: string;
  users: string[];
  overlappingTime: {
    start: string;
    end: string;
  };
  hangoutEvents: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: "personal" | "hangout";
  preferences?: {
    activitySuggestions: string[];
    budgetLimit?: number;
    maxTravelDistance?: number;
  };
}
