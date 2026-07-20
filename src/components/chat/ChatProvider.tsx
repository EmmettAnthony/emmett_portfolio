"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from "react";
import type {
  ChatMessageData
} from "@/types/chatbot";

interface ChatContextValue {
  isOpen: boolean;
  isFullScreen: boolean;
  messages: ChatMessageData[];
  conversationId: string | null;
  isTyping: boolean;
  unreadCount: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setFullScreen: (full: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  showContactForm: boolean;
  setShowContactForm: (show: boolean) => void;
  feedbackScore: number | null;
  setFeedbackScore: (score: number | null) => void;
  visitorId: string;
  proactiveMessage: string | null;
  clearProactiveMessage: () => void;
  triggeredBy: string | null;
  setTriggeredBy: (type: string | null) => void;
  showBookingCards: boolean;
  setShowBookingCards: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
export { ChatContext };

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}

const API_BASE = "/api/chat";

const STORAGE_KEYS = {
  conversationId: "chat-conversation-id",
  messages: "chat-messages",
  visitorId: "chat-visitor-id",
} as const;

function generateVisitorId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>(() =>
    loadFromStorage<ChatMessageData[]>(STORAGE_KEYS.messages, [])
  );
  const [conversationId, setConversationId] = useState<string | null>(() =>
    loadFromStorage<string | null>(STORAGE_KEYS.conversationId, null)
  );
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [triggeredBy, setTriggeredBy] = useState<string | null>(null);
  const [showBookingCards, setShowBookingCards] = useState(false);



  // Persistent visitorId
  const [visitorId] = useState<string>(() => {
    const stored = loadFromStorage<string | null>(STORAGE_KEYS.visitorId, null);
    if (stored) return stored;
    const id = generateVisitorId();
    saveToStorage(STORAGE_KEYS.visitorId, id);
    return id;
  });

  // Track whether we've loaded server messages for the current conversation
  const [loadedFromServer, setLoadedFromServer] = useState(false);

  // Persist conversationId to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (conversationId) {
        saveToStorage(STORAGE_KEYS.conversationId, conversationId);
      } else {
        saveToStorage(STORAGE_KEYS.conversationId, null);
        setLoadedFromServer(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [conversationId]);

  // Persist messages to localStorage (keep last 50 to stay under quota)
  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage(STORAGE_KEYS.messages, messages.slice(-50));
    } else {
      saveToStorage(STORAGE_KEYS.messages, []);
    }
  }, [messages]);

  // Load messages from server when reopening an existing conversation
  useEffect(() => {
    if (conversationId && !loadedFromServer) {
      fetch(`${API_BASE}/messages?conversationId=${conversationId}&limit=50`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch messages");
          return res.json();
        })
        .then((data) => {
          if (data.messages?.length > 0) {
            setMessages(data.messages);
            setLoadedFromServer(true);
          }
        })
        .catch(() => {
          // Silent fail — localStorage messages will be used as fallback
        });
    }
  }, [conversationId, loadedFromServer]);

  const open = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMessages([]);
    setConversationId(null);
    setFeedbackScore(null);
    setShowContactForm(false);
    setShowBookingCards(false);
    setProactiveMessage(null);
    setTriggeredBy(null);
    saveToStorage(STORAGE_KEYS.messages, []);
    saveToStorage(STORAGE_KEYS.conversationId, null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
    // Clear proactive message when toggling
    setProactiveMessage(null);
    setTriggeredBy(null);
  }, []);

  const setFullScreen = useCallback((full: boolean) => setIsFullScreen(full), []);

  const clearProactiveMessage = useCallback(() => setProactiveMessage(null), []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setFeedbackScore(null);
    setShowContactForm(false);
    setShowBookingCards(false);
    setProactiveMessage(null);
    setTriggeredBy(null);
    saveToStorage(STORAGE_KEYS.messages, []);
    saveToStorage(STORAGE_KEYS.conversationId, null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Clear any proactive message and triggeredBy once user sends something
    setProactiveMessage(null);

    const userMsg: ChatMessageData = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId || "",
      role: "user",
      content,
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content });

      const response = await fetch(`${API_BASE}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          conversationId,
          triggeredBy,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("You're sending too many messages. Please wait a moment.");
        }
        let errorMessage = "Failed to get response";
        try {
          const err = await response.json();
          errorMessage = err.message || errorMessage;
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text.slice(0, 200);
          } catch {}
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const assistantId = `msg-${Date.now()}`;
        let accumulated = "";
        let newConvId = conversationId;

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            conversationId: conversationId || "",
            role: "assistant",
            content: "",
            metadata: null,
            createdAt: new Date().toISOString(),
          },
        ]);

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- SSE stream parse type
            let data: any;
            try { data = JSON.parse(line.slice(6)); } catch { continue; }

            if (data.type === "done") {
              newConvId = data.conversationId;
              setConversationId(newConvId);
              saveToStorage(STORAGE_KEYS.conversationId, newConvId);
              if (data.humanHandoff) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, metadata: { ...m.metadata, humanHandoff: true } } : m
                  )
                );
              }
              if (data.bookingSuggested) {
                setShowBookingCards(true);
              }
            } else if (data.type === "booking_suggested") {
              setShowBookingCards(true);
            } else if (data.type === "lead_captured") {
              setShowContactForm(false);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, metadata: { ...m.metadata, leadCaptured: true } } : m
                )
              );
            } else if (data.content) {
              accumulated += data.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
              );
            }
          }
        }
      } else {
        const data = await response.json();

        setConversationId(data.conversationId);
        saveToStorage(STORAGE_KEYS.conversationId, data.conversationId);

        const assistantMsg: ChatMessageData = {
          id: `msg-${Date.now()}`,
          conversationId: data.conversationId,
          role: "assistant",
          content: data.message,
          metadata: data.leadCaptured ? { leadCaptured: true } : null,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.leadCaptured) {
          setShowContactForm(false);
        }
        if (data.bookingSuggested) {
          setShowBookingCards(true);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessageData = {
        id: `err-${Date.now()}`,
        conversationId: conversationId || "",
        role: "assistant",
        content: "Sorry, I encountered an issue. Please try again or contact me directly at hello@emmettanthony.dev",
        metadata: { isError: true },
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  },    [messages, conversationId, triggeredBy]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isFullScreen,
        messages,
        conversationId,
        isTyping,
        unreadCount,
        open,
        close,
        toggle,
        setFullScreen,
        sendMessage,
        clearMessages,
        showContactForm,
        setShowContactForm,
        feedbackScore,
        setFeedbackScore,
        visitorId,
        proactiveMessage,
        clearProactiveMessage,
        triggeredBy,
        setTriggeredBy,
        showBookingCards,
        setShowBookingCards,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
