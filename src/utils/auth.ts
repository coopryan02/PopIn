import { User } from "@/types";
import { userStorage } from "./storage";

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const hashPassword = (password: string): string => {
  // Simple hash for demo purposes - in production, use proper hashing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

export const createUser = (
  email: string,
  password: string,
  username: string,
  fullName: string,
): User => {
  return {
    id: generateId(),
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
};

export const authenticateUser = (
  email: string,
  password: string,
): User | null => {
  const users = userStorage.getUsers();
  const hashedPassword = hashPassword(password);

  const user = users.find(
    (u) =>
      u.email === email.toLowerCase() &&
      userStorage.storage.get(`password_${u.id}`) === hashedPassword,
  );

  return user || null;
};

export const registerUser = (
  email: string,
  password: string,
  username: string,
  fullName: string,
): { success: boolean; error?: string; user?: User } => {
  const users = userStorage.getUsers();

  // Check if email already exists
  if (users.some((u) => u.email === email.toLowerCase())) {
    return { success: false, error: "Email already exists" };
  }

  // Check if username already exists
  if (users.some((u) => u.username === username.toLowerCase())) {
    return { success: false, error: "Username already exists" };
  }

  // Validate email
  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { success: false, error: passwordValidation.errors[0] };
  }

  // Create new user
  const newUser = createUser(email, password, username, fullName);

  // Store password hash separately
  userStorage.storage.set(`password_${newUser.id}`, hashPassword(password));

  // Add user to users list
  users.push(newUser);
  userStorage.setUsers(users);

  return { success: true, user: newUser };
};

export const searchUsers = (query: string, currentUserId: string): User[] => {
  const users = userStorage.getUsers();
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) return [];

  return users.filter(
    (user) =>
      user.id !== currentUserId &&
      (user.username.toLowerCase().includes(searchTerm) ||
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)),
  );
};

export const sendFriendRequest = (
  fromUserId: string,
  toUserId: string,
): boolean => {
  const users = userStorage.getUsers();
  const fromUser = users.find((u) => u.id === fromUserId);
  const toUser = users.find((u) => u.id === toUserId);

  if (!fromUser || !toUser) return false;

  // Check if already friends
  if (fromUser.friends.includes(toUserId)) return false;

  // Check if request already sent
  if (fromUser.friendRequests.sent.includes(toUserId)) return false;

  // Add to sent requests
  fromUser.friendRequests.sent.push(toUserId);

  // Add to received requests
  toUser.friendRequests.received.push(fromUserId);

  userStorage.updateUser(fromUser);
  userStorage.updateUser(toUser);

  return true;
};

export const acceptFriendRequest = (
  userId: string,
  requesterId: string,
): boolean => {
  const users = userStorage.getUsers();
  const user = users.find((u) => u.id === userId);
  const requester = users.find((u) => u.id === requesterId);

  if (!user || !requester) return false;

  // Remove from friend requests
  user.friendRequests.received = user.friendRequests.received.filter(
    (id) => id !== requesterId,
  );
  requester.friendRequests.sent = requester.friendRequests.sent.filter(
    (id) => id !== userId,
  );

  // Add to friends
  user.friends.push(requesterId);
  requester.friends.push(userId);

  userStorage.updateUser(user);
  userStorage.updateUser(requester);

  return true;
};

export const rejectFriendRequest = (
  userId: string,
  requesterId: string,
): boolean => {
  const users = userStorage.getUsers();
  const user = users.find((u) => u.id === userId);
  const requester = users.find((u) => u.id === requesterId);

  if (!user || !requester) return false;

  // Remove from friend requests
  user.friendRequests.received = user.friendRequests.received.filter(
    (id) => id !== requesterId,
  );
  requester.friendRequests.sent = requester.friendRequests.sent.filter(
    (id) => id !== userId,
  );

  userStorage.updateUser(user);
  userStorage.updateUser(requester);

  return true;
};
