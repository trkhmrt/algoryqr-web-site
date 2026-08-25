"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  CHEF_WELCOME_MESSAGE,
  clearChefChatSession,
  getChefChatSession,
  setChefChatSession,
  type ChefChatMessage,
} from "@/lib/chef/chef-chat-session";
import type { ChefProductItem } from "@/lib/chef/parse-chef-query";
import type { ChefChatBadge } from "@/lib/chef/chef-chat-badges";
import { stripProductListFromReply } from "@/lib/chef/strip-product-list-from-reply";

import { MenuChefProductCard } from "./MenuChefProductCard";
import { MenuChefQuickBadges } from "./MenuChefQuickBadges";

type MenuChefChatProps = {
  menuId: number;
  chefDisplayName: string;
  chefAvatarUrl: string;
  open: boolean;
  onClose: () => void;
};

let messageSeq = 0;
function nextId() {
  messageSeq += 1;
  return `chef-msg-${messageSeq}`;
}

function ChefAvatar({
  size = 36,
  src,
  name,
  onClick,
}: {
  size?: number;
  src: string;
  name: string;
  onClick?: () => void;
}) {
  const content = (
    <span
      className="relative block overflow-hidden rounded-full bg-[#e8ebe9] shadow-[inset_0_0_0_1px_rgba(28,40,36,0.06)]"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={name}
        className="h-full w-full object-cover object-top"
      />
    </span>
  );

  if (!onClick) {
    return <span className="shrink-0">{content}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full transition hover:brightness-[0.97] active:scale-95"
      aria-label="Şef fotoğrafını büyüt"
    >
      {content}
    </button>
  );
}

function ChefAvatarLightbox({
  open,
  src,
  name,
  onClose,
}: {
  open: boolean;
  src: string;
  name: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="chef-avatar-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Şef fotoğrafı"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0f1613]/72 p-6 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className="relative h-[min(72vw,22rem)] w-[min(72vw,22rem)] overflow-hidden rounded-full bg-[#e8ebe9] shadow-[0_24px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/25"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={name}
              className="h-full w-full object-cover object-top"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const userMotion = {
  initial: { opacity: 0, y: 18, x: 28, scale: 0.88 },
  animate: { opacity: 1, y: 0, x: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.94 },
};

const assistantMotion = {
  initial: { opacity: 0, y: 18, x: -24, scale: 0.88 },
  animate: { opacity: 1, y: 0, x: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.94 },
};

const bubbleShellMotion = {
  initial: { opacity: 0, scale: 0.82, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
};

const bubbleTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 24,
  mass: 0.7,
};

function AssistantBubble({
  msg,
  animateEnter,
  onOpened,
  onEntered,
  onAvatarClick,
  chefAvatarUrl,
  chefDisplayName,
}: {
  msg: Extract<ChefChatMessage, { role: "assistant" }>;
  animateEnter: boolean;
  onOpened: () => void;
  onEntered: () => void;
  onAvatarClick: () => void;
  chefAvatarUrl: string;
  chefDisplayName: string;
}) {
  const onEnteredRef = useRef(onEntered);
  onEnteredRef.current = onEntered;

  const products = msg.products?.length ? msg.products : undefined;
  const displayText = products
    ? stripProductListFromReply(
        msg.text,
        products.map((product) => product.name),
      )
    : msg.text;

  return (
    <motion.div
      layout
      initial={animateEnter ? assistantMotion.initial : false}
      animate={assistantMotion.animate}
      exit={assistantMotion.exit}
      transition={bubbleTransition}
      onAnimationComplete={() => onEnteredRef.current()}
      className="flex max-w-[min(100%,34rem)] items-end gap-2.5 origin-bottom-left"
    >
      <motion.div
        initial={animateEnter ? { opacity: 0, scale: 0.55 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...bubbleTransition, delay: 0.02 }}
      >
        <ChefAvatar
          size={28}
          src={chefAvatarUrl}
          name={chefDisplayName}
          onClick={onAvatarClick}
        />
      </motion.div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {displayText ? (
          <motion.div
            initial={animateEnter ? bubbleShellMotion.initial : false}
            animate={bubbleShellMotion.animate}
            transition={{ ...bubbleTransition, delay: 0.06 }}
            className="origin-bottom-left whitespace-pre-wrap rounded-[1.35rem] rounded-bl-md border border-white/70 bg-white/80 px-4 py-3 text-[14.5px] leading-relaxed tracking-[-0.01em] text-[#24302c] shadow-[0_8px_28px_rgba(28,40,36,0.05)] backdrop-blur-sm"
          >
            {displayText}
          </motion.div>
        ) : null}
        {products ? (
          <motion.div
            initial={animateEnter ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bubbleTransition, delay: 0.1 }}
            role="list"
            aria-label="Önerilen ürünler"
            tabIndex={0}
            className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a3833]/25 [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.productId}
                role="listitem"
                initial={animateEnter ? { opacity: 0, x: 16, scale: 0.96 } : false}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  ...bubbleTransition,
                  delay: 0.12 + index * 0.05,
                }}
              >
                <MenuChefProductCard item={product} onOpened={onOpened} />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function MenuChefChat({
  menuId,
  chefDisplayName,
  chefAvatarUrl,
  open,
  onClose,
}: MenuChefChatProps) {
  const saved = getChefChatSession(menuId);
  const [messages, setMessages] = useState<ChefChatMessage[]>(
    () => saved?.messages ?? [CHEF_WELCOME_MESSAGE],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    () => saved?.conversationId,
  );
  const [sendPulse, setSendPulse] = useState(0);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const enteredIdsRef = useRef(
    new Set<string>(saved?.messages.map((msg) => msg.id) ?? ["welcome"]),
  );

  useEffect(() => {
    setChefChatSession(menuId, { messages, conversationId });
  }, [menuId, messages, conversationId]);

  useEffect(() => {
    if (!open) setAvatarOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  const scrollToBottom = () => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [messages, loading, open]);

  const canReset =
    Boolean(conversationId) || messages.some((msg) => msg.id !== "welcome");

  const resetChat = () => {
    if (loading) return;
    clearChefChatSession(menuId);
    enteredIdsRef.current = new Set(["welcome"]);
    setConversationId(undefined);
    setInput("");
    setMessages([{ ...CHEF_WELCOME_MESSAGE }]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setSendPulse((value) => value + 1);
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch("/api/menu/chef/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, message: trimmed, conversationId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        conversationId?: string;
        message?: string;
        products?: ChefProductItem[];
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
      const products = Array.isArray(data.products) ? data.products : undefined;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: reply || "Menüde uygun ürün bulamadım. Başka bir şekilde sorabilir misiniz?",
          products: products?.length ? products : undefined,
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

  const sendBadge = async (badge: ChefChatBadge) => {
    if (loading) return;
    setSendPulse((value) => value + 1);
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: badge.label }]);
    setLoading(true);
    try {
      const res = await fetch("/api/menu/chef/badge-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, badgeId: badge.id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        message?: string;
        products?: ChefProductItem[];
      };
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
      const products = Array.isArray(data.products) ? data.products : undefined;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: reply || "Bu filtre için uygun ürün bulamadım.",
          products: products?.length ? products : undefined,
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

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage(text);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="chef-chat-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed inset-0 z-[70] flex flex-col overflow-hidden overscroll-none bg-[#f3f5f4]"
        >
          <div className="relative flex h-full min-h-0 flex-col">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(186,210,198,0.28),_transparent_45%),linear-gradient(180deg,#f7f8f7_0%,#eef1ef_100%)]"
            />

            <header className="relative z-10 border-b border-[#1c2824]/[0.06] bg-white/55 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ChefAvatar
                    size={42}
                    src={chefAvatarUrl}
                    name={chefDisplayName}
                    onClick={() => setAvatarOpen(true)}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#1c2824]">
                      {chefDisplayName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#5f6f68]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Şefe danış
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={resetChat}
                    disabled={!canReset || loading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1c2824]/[0.04] px-3 text-[12px] font-medium text-[#3d4a45] transition hover:bg-[#1c2824]/[0.08] hover:text-[#1c2824] disabled:pointer-events-none disabled:opacity-35"
                    aria-label="Sohbeti sıfırla"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
                    <span className="hidden sm:inline">Sıfırla</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1c2824]/[0.04] text-[#3d4a45] transition hover:bg-[#1c2824]/[0.08] hover:text-[#1c2824]"
                    aria-label="Kapat"
                  >
                    <X className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </header>

            <div
              ref={listRef}
              data-chef-scroll
              className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="mx-auto flex max-w-2xl flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => {
                    const shouldEnter = !enteredIdsRef.current.has(msg.id);
                    const markEntered = () => {
                      enteredIdsRef.current.add(msg.id);
                    };
                    if (msg.role === "assistant") {
                      return (
                        <AssistantBubble
                          key={msg.id}
                          msg={msg}
                          animateEnter={shouldEnter}
                          onOpened={onClose}
                          onEntered={markEntered}
                          onAvatarClick={() => setAvatarOpen(true)}
                          chefAvatarUrl={chefAvatarUrl}
                          chefDisplayName={chefDisplayName}
                        />
                      );
                    }
                    return (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={shouldEnter ? userMotion.initial : false}
                        animate={userMotion.animate}
                        exit={userMotion.exit}
                        transition={bubbleTransition}
                        onAnimationComplete={markEntered}
                        className="ml-auto flex max-w-[min(100%,28rem)] justify-end origin-bottom-right"
                      >
                        <motion.div
                          initial={shouldEnter ? bubbleShellMotion.initial : false}
                          animate={bubbleShellMotion.animate}
                          transition={{ ...bubbleTransition, delay: 0.04 }}
                          className="origin-bottom-right whitespace-pre-wrap rounded-[1.35rem] rounded-br-md bg-[#2a3833] px-4 py-3 text-[14.5px] leading-relaxed tracking-[-0.01em] text-[#f4f7f5] shadow-[0_10px_28px_rgba(28,40,36,0.14)]"
                        >
                          {msg.text}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {loading ? (
                    <motion.div
                      key="chef-typing"
                      initial={{ opacity: 0, y: 10, x: -8 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={bubbleTransition}
                      className="flex items-end gap-2.5"
                    >
                      <ChefAvatar
                        size={28}
                        src={chefAvatarUrl}
                        name={chefDisplayName}
                        onClick={() => setAvatarOpen(true)}
                      />
                      <div className="flex items-center gap-1.5 rounded-[1.35rem] rounded-bl-md border border-white/70 bg-white/80 px-4 py-3.5 shadow-[0_8px_28px_rgba(28,40,36,0.05)] backdrop-blur-sm">
                        <span className="animate-chef-typing-dot h-1.5 w-1.5 rounded-full bg-[#8a9a93] [animation-delay:0ms]" />
                        <span className="animate-chef-typing-dot h-1.5 w-1.5 rounded-full bg-[#8a9a93] [animation-delay:140ms]" />
                        <span className="animate-chef-typing-dot h-1.5 w-1.5 rounded-full bg-[#8a9a93] [animation-delay:280ms]" />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <form
              className="relative z-10 border-t border-[#1c2824]/[0.06] bg-white/60 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <MenuChefQuickBadges
                menuId={menuId}
                disabled={loading}
                onSelect={(badge) => {
                  void sendBadge(badge);
                }}
              />
              <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-[#1c2824]/[0.08] bg-white/90 p-1.5 shadow-[0_10px_30px_rgba(28,40,36,0.06)]">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ne önerelim? Örn. 200 TL tatlı"
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[14.5px] text-[#1c2824] outline-none placeholder:text-[#8a9a93]"
                  disabled={loading}
                />
                <motion.button
                  key={sendPulse}
                  type="submit"
                  disabled={loading || !input.trim()}
                  initial={sendPulse > 0 ? { scale: 0.86 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a3833] text-white transition enabled:hover:bg-[#1f2b27] disabled:opacity-35"
                  aria-label="Gönder"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </form>

            <ChefAvatarLightbox
              open={avatarOpen}
              src={chefAvatarUrl}
              name={chefDisplayName}
              onClose={() => setAvatarOpen(false)}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
