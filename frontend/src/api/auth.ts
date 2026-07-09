import { get } from "./client";
import { AuthUser } from "./types";

export const fetchMe = () => get<{ user: AuthUser }>("/auth/me");
