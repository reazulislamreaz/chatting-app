export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  address?: string;
  professional?: string;
  religious?: string;
  hobby?: string;
  dateOfBirth?: string;
  isOnline?: boolean;
  lastSeen?: string;
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  read: boolean;
  readAt?: string;
  isDeleted?: boolean;
  editedAt?: string;
  createdAt: string;
}

export interface ChatListItem {
  user: User;
  lastMessage: {
    id: string;
    content: string;
    imageUrl?: string;
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
