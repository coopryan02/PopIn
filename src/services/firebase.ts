import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, Event, Message, Notification } from "@/types";

// User Management with Real Firebase
export const createUserAccount = async (
  email: string,
  password: string,
  username: string,
  fullName: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    console.log("Creating user account...", { email, username, fullName });

    // Check if username is already taken
    const usernameQuery = query(
      collection(db, "users"),
      where("username", "==", username.toLowerCase()),
    );
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      console.log("Username already exists");
      return { success: false, error: "Username already exists" };
    }

    // Create Firebase user
    console.log("Creating Firebase auth user...");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const firebaseUser = userCredential.user;

    console.log("Firebase user created:", firebaseUser.uid);

    // Update Firebase profile
    await updateProfile(firebaseUser, {
      displayName: fullName,
    });

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
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

    console.log("Saving user data to Firestore...", userData);
    await setDoc(doc(db, "users", firebaseUser.uid), userData);

    console.log("User account created successfully!");
    return { success: true, user: userData };
  } catch (error: any) {
    console.error("Error creating user:", error);
    let errorMessage = "Failed to create account";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const signInUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    console.log("Signing in user...", email);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const firebaseUser = userCredential.user;

    console.log("Firebase auth successful:", firebaseUser.uid);

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!userDoc.exists()) {
      console.error("User data not found in Firestore");
      return { success: false, error: "User data not found" };
    }

    const userData = userDoc.data() as User;
    console.log("User signed in successfully:", userData);
    return { success: true, user: userData };
  } catch (error: any) {
    console.error("Error signing in:", error);
    let errorMessage = "Failed to sign in";

    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    console.log("Signing out user...");
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    console.log("No current Firebase user");
    return null;
  }

  try {
    console.log("Getting current user data:", firebaseUser.uid);
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log("Setting up auth state listener...");
  return onAuthStateChanged(auth, async (firebaseUser) => {
    console.log("Auth state changed:", firebaseUser?.uid || "null");
    if (firebaseUser) {
      const userData = await getCurrentUser();
      callback(userData);
    } else {
      callback(null);
    }
  });
};

// User Search and Friends
export const searchUsers = async (
  query: string,
  currentUserId: string,
): Promise<User[]> => {
  try {
    const usersQuery = collection(db, "users");
    const snapshot = await getDocs(usersQuery);

    const users: User[] = [];
    snapshot.forEach((doc) => {
      const userData = doc.data() as User;
      if (
        userData.id !== currentUserId &&
        (userData.username.toLowerCase().includes(query.toLowerCase()) ||
          userData.fullName.toLowerCase().includes(query.toLowerCase()) ||
          userData.email.toLowerCase().includes(query.toLowerCase()))
      ) {
        users.push(userData);
      }
    });

    return users;
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
    // Update sender's sent requests
    const fromUserRef = doc(db, "users", fromUserId);
    await updateDoc(fromUserRef, {
      "friendRequests.sent": arrayUnion(toUserId),
    });

    // Update receiver's received requests
    const toUserRef = doc(db, "users", toUserId);
    await updateDoc(toUserRef, {
      "friendRequests.received": arrayUnion(fromUserId),
    });

    // Create notification
    await addDoc(collection(db, "notifications"), {
      userId: toUserId,
      type: "friend_request",
      title: "New Friend Request",
      message: "Someone sent you a friend request",
      data: { senderId: fromUserId },
      read: false,
      createdAt: serverTimestamp(),
    });

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
    // Update both users' friend lists
    const userRef = doc(db, "users", userId);
    const requesterRef = doc(db, "users", requesterId);

    await updateDoc(userRef, {
      "friendRequests.received": arrayRemove(requesterId),
      friends: arrayUnion(requesterId),
    });

    await updateDoc(requesterRef, {
      "friendRequests.sent": arrayRemove(userId),
      friends: arrayUnion(userId),
    });

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
    const userRef = doc(db, "users", userId);
    const requesterRef = doc(db, "users", requesterId);

    await updateDoc(userRef, {
      "friendRequests.received": arrayRemove(requesterId),
    });

    await updateDoc(requesterRef, {
      "friendRequests.sent": arrayRemove(userId),
    });

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
    const docRef = await addDoc(collection(db, "events"), {
      ...event,
      createdAt: serverTimestamp(),
    });

    // If it's a hangout, check for overlaps
    if (event.type === "hangout") {
      await checkForHangoutOverlaps(docRef.id, event);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    return null;
  }
};

export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      where("userId", "==", userId),
      orderBy("startTime", "asc"),
    );

    const snapshot = await getDocs(eventsQuery);
    const events: Event[] = [];

    snapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() } as Event);
    });

    return events;
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
    await updateDoc(doc(db, "events", eventId), updates);
    return true;
  } catch (error) {
    console.error("Error updating event:", error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "events", eventId));
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
    // Get user's friends
    const userDoc = await getDoc(doc(db, "users", event.userId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as User;
    const friends = userData.friends;

    // Get all friend hangouts
    for (const friendId of friends) {
      const friendEventsQuery = query(
        collection(db, "events"),
        where("userId", "==", friendId),
        where("type", "==", "hangout"),
      );

      const friendEventsSnapshot = await getDocs(friendEventsQuery);

      friendEventsSnapshot.forEach(async (friendEventDoc) => {
        const friendEvent = friendEventDoc.data() as Event;

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
          await addDoc(collection(db, "notifications"), {
            userId: event.userId,
            type: "hangout_match",
            title: "Hangout Match Found!",
            message: "You have an overlapping hangout time with a friend",
            data: {
              matchedUserId: friendId,
              overlappingTime: overlap,
              hangoutEvents: [eventId, friendEventDoc.id],
            },
            read: false,
            createdAt: serverTimestamp(),
          });

          await addDoc(collection(db, "notifications"), {
            userId: friendId,
            type: "hangout_match",
            title: "Hangout Match Found!",
            message: "You have an overlapping hangout time with a friend",
            data: {
              matchedUserId: event.userId,
              overlappingTime: overlap,
              hangoutEvents: [eventId, friendEventDoc.id],
            },
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      });
    }
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
    const conversationId = [senderId, receiverId].sort().join("-");

    // Add message to messages collection
    await addDoc(collection(db, "messages"), {
      senderId,
      receiverId,
      content,
      conversationId,
      timestamp: serverTimestamp(),
      read: false,
    });

    // Create notification for receiver
    await addDoc(collection(db, "notifications"), {
      userId: receiverId,
      type: "message",
      title: "New Message",
      message: "You received a new message",
      data: { senderId },
      read: false,
      createdAt: serverTimestamp(),
    });

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
  const messagesQuery = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc"),
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        timestamp:
          data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        read: data.read,
      });
    });
    callback(messages);
  });
};

// Notifications
export const getUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
) => {
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: data.read,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    callback(notifications);
  });
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};
