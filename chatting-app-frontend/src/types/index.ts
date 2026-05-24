export type FriendshipStatus =
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received"
  | "none";

export interface UserRelationship {
  status: FriendshipStatus;
  requestId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  address?: string;
  professional?: string;
  religious?: string;
  hobby?: string;
  relationStatus?: string;
  dateOfBirth?: string;
  isOnline?: boolean;
  lastSeen?: string;
  relationship?: UserRelationship;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FriendRequest {
  id: string;
  sender?: User;
  receiver?: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export type CallLogStatus =
  | "completed"
  | "rejected"
  | "cancelled"
  | "missed"
  | "busy"
  | "disconnected";

export interface MessageReply {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  isDeleted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  messageType?: "text" | "call";
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  callStatus?: CallLogStatus;
  callDuration?: number;
  read: boolean;
  readAt?: string;
  isDeleted?: boolean;
  editedAt?: string;
  replyTo?: MessageReply;
  createdAt: string;
}

export interface ChatListItem {
  user: User;
  lastMessage: {
    id: string;
    messageType?: "text" | "call";
    content: string;
    imageUrl?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    callStatus?: CallLogStatus;
    callDuration?: number;
    isDeleted?: boolean;
    senderId: string;
    createdAt: string;
    read: boolean;
  } | null;
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PostAuthor {
  id: string;
  name: string;
  profilePicture?: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  content: string;
  author: PostAuthor;
  createdAt: string;
}
