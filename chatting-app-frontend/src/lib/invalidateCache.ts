import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export function invalidateChats(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: queryKeys.chats });
}

export function invalidateUser(qc: QueryClient, userId: string) {
  return qc.invalidateQueries({ queryKey: queryKeys.user(userId) });
}

export function invalidateUsers(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: ["users"] });
}

export function invalidateProfile(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: queryKeys.profile });
}

export function invalidateFeed(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: queryKeys.feed });
}

export function invalidateFriends(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.friends }),
    qc.invalidateQueries({ queryKey: queryKeys.friendReceived }),
    qc.invalidateQueries({ queryKey: queryKeys.friendSent }),
  ]);
}

export function invalidateMessages(qc: QueryClient, userId: string) {
  return qc.invalidateQueries({ queryKey: queryKeys.messages(userId) });
}

/** After friend-request actions (send, accept, reject). */
export function invalidateSocial(qc: QueryClient, userId?: string) {
  const tasks: Promise<unknown>[] = [
    invalidateUsers(qc),
    invalidateFriends(qc),
  ];
  if (userId) tasks.push(invalidateUser(qc, userId));
  return Promise.all(tasks);
}
