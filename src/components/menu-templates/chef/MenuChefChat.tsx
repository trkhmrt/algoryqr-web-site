"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatMessage =
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "user"; text: string };

type MenuChefChatProps = {
  menuId: number;
  open: boolean;
  onClose: () => void;
};

let messageSeq = 0;
function nextId() {
  messageSeq += 1;
  return `chef-msg-${messageSeq}`;
}

export function MenuChefChat({ menuId, open, onClose }: MenuChefChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Size nasıl yardımcı olabilirim?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/menu/chef/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, message: text, conversationId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        conversationId?: string;
        message?: string;
      };
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            text: data.message || "Öneri alınamadı. Lütfen tekrar deneyin.",
          },
        ]);
        return;
      }
      const reply = data.reply?.trim();
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: reply || "Menüde uygun ürün bulamadım. Başka bir şekilde sorabilir misiniz?",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: "Bağlantı hatası. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-[70] mx-auto flex max-h-[min(70vh,560px)] w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#f7f4ef] shadow-2xl sm:inset-x-auto sm:right-5 sm:left-auto sm:w-[380px]">
      <header className="flex items-center justify-between gap-3 border-b border-black/8 bg-[#1c1917] px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/90">
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide">Şefe danış</p>
            <p className="text-[11px] text-white/65">Menü asistanı</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg) => {
          if (msg.role === "assistant") {
            return (
              <div
                key={msg.id}
                className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-neutral-800 shadow-sm"
              >
                {msg.text}
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-[#1c1917] px-3.5 py-2.5 text-sm text-white"
            >
              {msg.text}
            </div>
          );
        })}
        {loading ? (
          <div className="flex gap-1.5 px-1 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:240ms]" />
          </div>
        ) : null}
      </div>

      <form
        className="flex items-center gap-2 border-t border-black/8 bg-white/80 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Örn. 200 TL tatlı öner"
          className="min-w-0 flex-1 rounded-full border border-black/10 bg-[#f7f4ef] px-4 py-2.5 text-sm outline-none ring-amber-600/30 placeholder:text-neutral-400 focus:ring-2"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white transition enabled:hover:bg-amber-700 disabled:opacity-40"
          aria-label="Gönder"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
