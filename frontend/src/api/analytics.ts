import { fetchBlob } from "./client";

export const exportAnalytics = () => fetchBlob("/analytics/export");
