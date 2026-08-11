import type { ChefProductItem } from "@/lib/chef/parse-chef-query";

export type ChefChatMessage =
  | { id: string; role: "assistant"; text: string; products?: ChefProductItem[] }
  | { id: string; role: "user"; text: string };

type ChefChatSession = {
  messages: ChefChatMessage[];
  conversationId?: string;
};

const sessions = new Map<number, ChefChatSession>();

export const CHEF_WELCOME_MESSAGE: ChefChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Size nasıl yardımcı olabilirim?",
};

export function getChefChatSession(menuId: number): ChefChatSession | undefined {
  return sessions.get(menuId);
}

export function setChefChatSession(menuId: number, session: ChefChatSession): void {
  sessions.set(menuId, session);
}

export function clearChefChatSession(menuId: number): void {
  sessions.delete(menuId);
}
