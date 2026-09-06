import type { ChefProductItem } from "@/lib/chef/parse-chef-query";
import type { SearchCompletePayload } from "@/lib/chef/search-complete";

export type ChefChatMessage =
  | {
      id: string;
      role: "assistant";
      text: string;
      products?: ChefProductItem[];
      searchComplete?: SearchCompletePayload;
    }
  | { id: string; role: "user"; text: string };

type ChefChatSession = {
  messages: ChefChatMessage[];
  conversationId?: string;
};

const sessions = new Map<string, ChefChatSession>();

export const CHEF_WELCOME_MESSAGE: ChefChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Size nasıl yardımcı olabilirim?",
};

export function getChefChatSession(publicId: string): ChefChatSession | undefined {
  return sessions.get(publicId);
}

export function setChefChatSession(publicId: string, session: ChefChatSession): void {
  sessions.set(publicId, session);
}

export function clearChefChatSession(publicId: string): void {
  sessions.delete(publicId);
}
