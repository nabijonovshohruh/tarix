import { Request, Response } from "express";
import { bot } from "../bot/bot";
import { getChannelUrl, invalidateChannelSubscription, isChannelSubscriber } from "../services/channelSubscription.service";

export function getMe(req: Request, res: Response) {
  res.json({ user: req.user, channelUrl: getChannelUrl() });
}

// Called explicitly by the frontend's "recheck" action after a student says
// they've joined the channel — bypasses the short cache in
// channelSubscription.service.ts so the result is immediate and accurate,
// unlike the passive check embedded in every other request.
export async function postRecheckSubscription(req: Request, res: Response) {
  invalidateChannelSubscription(req.user!.telegramId);
  const channelSubscribed = await isChannelSubscriber(bot.api, req.user!.telegramId);
  res.json({ channelSubscribed });
}
