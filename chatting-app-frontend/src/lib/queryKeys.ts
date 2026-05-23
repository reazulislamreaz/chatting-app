export const queryKeys = {
  chats: ["chats"] as const,
  users: (search: string) => ["users", search] as const,
  user: (id: string) => ["user", id] as const,
  profile: ["profile"] as const,
  feed: ["feed"] as const,
  friends: ["friends"] as const,
  friendReceived: ["friend-requests", "received"] as const,
  friendSent: ["friend-requests", "sent"] as const,
  messages: (userId: string) => ["messages", userId] as const,
};
