import mongoose from "mongoose";
import { FriendRequest } from "./friendRequest.model";
import { User } from "../auth/auth.model";
import { AppError } from "../../utils/AppError";
import {
  isPopulatedUser,
  formatPopulatedUser,
  PopulatedUser,
} from "../../utils/populatedUser";
import {
  FRIEND_REQUEST_SELECT,
  USER_EXISTS_SELECT,
} from "../../constants/queryFields";

const POPULATE_USER_FIELDS = "name email profilePicture isOnline lastSeen";

export class FriendRequestService {
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new AppError(400, "Cannot send request to yourself");
    }

    const receiver = await User.findById(receiverId)
      .select(USER_EXISTS_SELECT)
      .lean();
    if (!receiver) {
      throw new AppError(404, "User not found");
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .select(FRIEND_REQUEST_SELECT)
      .lean();

    if (existing) {
      if (existing.status === "accepted") {
        throw new AppError(409, "You are already friends");
      }
      if (existing.status === "pending") {
        throw new AppError(409, "Friend request already pending");
      }
      if (existing.status === "rejected") {
        if (existing.senderId.toString() === senderId) {
          await FriendRequest.findByIdAndUpdate(existing._id, { status: "pending" });
          return this.populateRequest(existing._id.toString());
        }
        throw new AppError(409, "Previous request was rejected");
      }
    }

    const request = await FriendRequest.create({ senderId, receiverId });
    return this.populateRequest(request._id.toString());
  }

  async respondToRequest(
    requestId: string,
    receiverId: string,
    action: "accept" | "reject"
  ) {
    const request = await FriendRequest.findById(requestId)
      .select(FRIEND_REQUEST_SELECT)
      .lean();
    if (!request) {
      throw new AppError(404, "Friend request not found");
    }

    if (request.receiverId.toString() !== receiverId) {
      throw new AppError(403, "Not authorized to respond to this request");
    }

    if (request.status !== "pending") {
      throw new AppError(400, "Request already processed");
    }

    await FriendRequest.findByIdAndUpdate(requestId, {
      status: action === "accept" ? "accepted" : "rejected",
    });

    return this.populateRequest(requestId);
  }

  async getPendingReceived(userId: string) {
    const requests = await FriendRequest.find({
      receiverId: userId,
      status: "pending",
    })
      .select(FRIEND_REQUEST_SELECT)
      .populate("senderId", POPULATE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return requests.map((r) => {
      if (!isPopulatedUser(r.senderId)) {
        throw new AppError(500, "Failed to populate sender");
      }
      return {
        id: r._id.toString(),
        sender: formatPopulatedUser(r.senderId),
        status: r.status,
        createdAt: r.createdAt,
      };
    });
  }

  async getPendingSent(userId: string) {
    const requests = await FriendRequest.find({
      senderId: userId,
      status: "pending",
    })
      .select(FRIEND_REQUEST_SELECT)
      .populate("receiverId", POPULATE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return requests.map((r) => {
      if (!isPopulatedUser(r.receiverId)) {
        throw new AppError(500, "Failed to populate receiver");
      }
      return {
        id: r._id.toString(),
        receiver: formatPopulatedUser(r.receiverId),
        status: r.status,
        createdAt: r.createdAt,
      };
    });
  }

  async getFriends(userId: string) {
    const friendships = await FriendRequest.find({
      status: "accepted",
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .select(FRIEND_REQUEST_SELECT)
      .populate("senderId", POPULATE_USER_FIELDS)
      .populate("receiverId", POPULATE_USER_FIELDS)
      .lean();

    return friendships.map((f) => {
      if (!isPopulatedUser(f.senderId) || !isPopulatedUser(f.receiverId)) {
        throw new AppError(500, "Failed to populate friends");
      }
      const sender = f.senderId;
      const receiver = f.receiverId;
      const friend: PopulatedUser =
        sender._id.toString() === userId ? receiver : sender;

      return {
        friendshipId: f._id.toString(),
        ...formatPopulatedUser(friend),
      };
    });
  }

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await FriendRequest.findOne({
      status: "accepted",
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .select("_id")
      .lean();
    return !!friendship;
  }

  private async populateRequest(requestId: string) {
    const request = await FriendRequest.findById(requestId)
      .select(FRIEND_REQUEST_SELECT)
      .populate("senderId", "name email profilePicture")
      .populate("receiverId", "name email profilePicture")
      .lean();

    if (!request) {
      throw new AppError(404, "Request not found");
    }

    if (!isPopulatedUser(request.senderId) || !isPopulatedUser(request.receiverId)) {
      throw new AppError(500, "Failed to populate request");
    }

    return {
      id: request._id.toString(),
      sender: formatPopulatedUser(request.senderId),
      receiver: formatPopulatedUser(request.receiverId),
      status: request.status,
      createdAt: request.createdAt,
    };
  }
}

export const friendRequestService = new FriendRequestService();
