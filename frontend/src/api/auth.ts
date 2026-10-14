import { get, post } from "./client";
import { AuthUser } from "./types";

export const fetchMe = () => get<{ user: AuthUser; channelUrls: (string | null)[] }>("/auth/me");

export const recheckSubscription = () =>
  post<{ channelSubscribed: boolean }>("/auth/recheck-subscription");
