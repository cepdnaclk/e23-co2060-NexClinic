"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
import MockPaymentGateway from "@/components/payment/MockPaymentGateway";

type Role = "PATIENT" | "DOCTOR";

type ChatThread = {
  id: string;
  thread_code: string;
  status: "OPEN" | "CLOSED" | string;
  started_at: string;
  last_message_at: string | null;
  expires_at: string | null;
  price_paid: string;
  doctorName?: string;
  patientName?: string;
  doctor_id?: string;
  unreadCount: number;
  lastMessage: string;
};

type ChatMessage = {
  id: string;
  thread: string;
  sender_user: string;
  sender_role: Role;
  message_text: string;
  attachment: string | null;
  is_read: boolean;
  sent_at: string;
};

type ChatWorkspaceProps = {
  role: Role;
  onSessionExpired: () => void;
  onPatientChatUnavailable?: (message: string) => void;
  browseHref: string;
  browseLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  defaultDoctorId?: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
}

function getPeerName(thread: ChatThread, role: Role) {
  if (role === "DOCTOR") {
    return thread.patientName || "Patient";
  }

  return thread.doctorName || "Doctor";
}

export default function ChatWorkspace({
  role,
  onSessionExpired,
  onPatientChatUnavailable,
  browseHref,
  browseLabel,
  emptyStateTitle,
  emptyStateDescription,
  defaultDoctorId,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [composer, setComposer] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [initialThreadsLoaded, setInitialThreadsLoaded] = useState(false);
  const [wsStatus, setWsStatus] = useState<"Connecting..." | "Connected" | "Disconnected">("Disconnected");
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingDoctorId, setPendingDoctorId] = useState("");
  const [pendingPrice, setPendingPrice] = useState("0");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const hasAutoOpenedDoctorRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const selectedThreadIdRef = useRef(selectedThreadId);
  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const onPatientChatUnavailableRef = useRef(onPatientChatUnavailable);
  useEffect(() => {
    onPatientChatUnavailableRef.current = onPatientChatUnavailable;
  }, [onPatientChatUnavailable]);

  const selectedThread = useMemo(
    () => threads.find((thread) => String(thread.id) === String(selectedThreadId)) || null,
    [selectedThreadId, threads],
  );

  const [timeLeft, setTimeLeft] = useState<string>("");
  const isExpired = useMemo(() => {
    if (!selectedThread?.expires_at) return false;
    return new Date(selectedThread.expires_at).getTime() < Date.now();
  }, [selectedThread?.expires_at, timeLeft]); // depend on timeLeft to re-evaluate every minute

  useEffect(() => {
    if (!selectedThread?.expires_at) {
      setTimeLeft("");
      return;
    }
    const updateTimeLeft = () => {
      const diff = new Date(selectedThread.expires_at!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [selectedThread?.expires_at]);

  const filteredThreads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return threads.filter((thread) => {
      const peerName = getPeerName(thread, role).toLowerCase();
      const preview = (thread.lastMessage || "").toLowerCase();
      const threadCode = thread.thread_code.toLowerCase();
      return (
        !normalizedQuery ||
        peerName.includes(normalizedQuery) ||
        preview.includes(normalizedQuery) ||
        threadCode.includes(normalizedQuery)
      );
    });
  }, [role, searchQuery, threads]);

  const unreadCount = useMemo(
    () => threads.reduce((total, thread) => total + (thread.unreadCount || 0), 0),
    [threads],
  );

  const loadThreads = useCallback(async (preserveSelected = true) => {
    setLoadingThreads(true);
    setError("");

    try {
      const response = await fetch("/api/chat/threads", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        onSessionExpiredRef.current?.();
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to load chats");
      }

      const nextThreads: ChatThread[] = Array.isArray(payload?.threads) ? (payload.threads as ChatThread[]) : [];
      setThreads(nextThreads);
      setInitialThreadsLoaded(true);

      const currentSelectedId = selectedThreadIdRef.current;
      if (!preserveSelected) {
        setSelectedThreadId(nextThreads[0]?.id || "");
      } else if (currentSelectedId && !nextThreads.some((thread) => thread.id === currentSelectedId)) {
        setSelectedThreadId(nextThreads[0]?.id || "");
      } else if (!currentSelectedId && nextThreads.length > 0) {
        setSelectedThreadId(nextThreads[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    setError("");

    try {
      const response = await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        onSessionExpiredRef.current?.();
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to load messages");
      }

      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
    } catch (err) {
      setMessages([]);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const openOrCreatePatientThread = useCallback(async (doctorId: string) => {
    // If there is an already OPEN and unexpired thread for this doctor, just select it
    const existingThread = threads.find(
      (t) => t.doctor_id === doctorId && t.status === "OPEN" && (!t.expires_at || new Date(t.expires_at).getTime() > Date.now())
    );
    if (existingThread) {
      setSelectedThreadId(existingThread.id);
      return;
    }

    try {
      const profileResponse = await fetch(`/api/doctor/directory/${doctorId}/`);
      if (!profileResponse.ok) throw new Error("Failed to fetch doctor profile");
      const profilePayload = await profileResponse.json().catch(() => ({}));
      const profile = profilePayload?.doctor || profilePayload;
      
      if (!profile.availableForChat) {
         throw new Error("This doctor is currently offline for chats.");
      }
      
      setPendingDoctorId(doctorId);
      
      const rawPrice = profile.chatFee || "Rs. 0.00";
      setPendingPrice(rawPrice);
      
      setShowPaymentModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate chat");
    }
  }, [threads]);

  const handlePaymentSuccess = async () => {
    if (!pendingDoctorId) return;
    setIsProcessingPayment(true);
    setError("");

    try {
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: pendingDoctorId }),
      });

      if (response.status === 401 || response.status === 403) {
        onSessionExpiredRef.current?.();
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (response.status === 409 && role === "PATIENT") {
        const message = payload?.detail || "This doctor is currently offline for chats.";
        onPatientChatUnavailableRef.current?.(message);
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to open chat");
      }

      const threadId = payload?.thread?.id ? String(payload.thread.id) : "";
      if (threadId) {
        setShowPaymentModal(false);
        setSelectedThreadId(threadId);
        await loadThreads(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open chat");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedThreadId || selectedThread?.status === "CLOSED" || isExpired) {
      return;
    }
    if (!composer.trim() && !attachmentFile) {
      return;
    }

    setSending(true);
    setError("");

    try {
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("attachment", attachmentFile);
        formData.append("message_text", composer.trim());

        const response = await fetch(`/api/chat/threads/${selectedThreadId}/messages/upload/`, {
          method: "POST",
          body: formData,
        });

        if (response.status === 401 || response.status === 403) {
          onSessionExpired();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || payload?.detail || "Failed to send attachment");
        }

        setComposer("");
        setAttachmentFile(null);
        await Promise.all([loadMessages(selectedThreadId), loadThreads(true)]);
      } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ message_text: composer.trim() }));
        setComposer("");
      } else {
        const response = await fetch(`/api/chat/threads/${selectedThreadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_text: composer.trim() }),
        });

        if (response.status === 401 || response.status === 403) {
          onSessionExpired();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || payload?.detail || "Failed to send message");
        }

        setComposer("");
        await Promise.all([loadMessages(selectedThreadId), loadThreads(true)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const updateThreadStatus = async (action: "close" | "reopen") => {
    if (!selectedThreadId) return;

    setActionBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/chat/threads/${selectedThreadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.status === 401 || response.status === 403) {
        onSessionExpired();
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to update thread status");
      }

      const updatedThread = payload?.thread;
      if (updatedThread?.id) {
        setThreads((current) =>
          current.map((thread) =>
            thread.id === String(updatedThread.id) ? { ...thread, status: updatedThread.status } : thread,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update thread status");
    } finally {
      setActionBusy(false);
    }
  };

  const selectThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(currentSearch);
    params.set("thread", threadId);
    if (role === "PATIENT" && defaultDoctorId) {
      params.set("doctor", defaultDoctorId);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, role, defaultDoctorId]);

  useEffect(() => {
    void loadThreads(false);
  }, [loadThreads]);

  useEffect(() => {
    const initialThreadId = searchParams.get("thread") || "";
    if (initialThreadId) {
      setSelectedThreadId(initialThreadId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedThreadId) return;
    if (!threads.some((thread) => String(thread.id) === String(selectedThreadId))) return;
    void loadMessages(selectedThreadId);
  }, [selectedThreadId, threads, loadMessages]);

  useEffect(() => {
    if (!initialThreadsLoaded || hasAutoOpenedDoctorRef.current) return;
    if (role !== "PATIENT" || !defaultDoctorId) return;

    hasAutoOpenedDoctorRef.current = true;
    void openOrCreatePatientThread(defaultDoctorId);
  }, [defaultDoctorId, initialThreadsLoaded, role, openOrCreatePatientThread]);

  // WebSocket Connection
  useEffect(() => {
    if (!selectedThreadId) return;

    setWsStatus("Connecting...");
    
    // Retrieve authToken from localStorage to authenticate the WebSocket request
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const wsUrl = `${backendUrl}/ws/chat/${selectedThreadId}/${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          // Refresh thread list to update unread counts and last message preview
          loadThreads(true);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsStatus("Disconnected");
    };

    ws.onclose = () => {
      setWsStatus("Disconnected");
    };

    return () => {
      ws.close();
    };
  }, [selectedThreadId, loadThreads]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!filteredThreads.length) return;
    if (filteredThreads.some((thread) => String(thread.id) === String(selectedThreadId))) return;
    const threadId = filteredThreads[0].id;
    setSelectedThreadId(String(threadId));
    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(currentSearch);
    params.set("thread", String(threadId));
    if (role === "PATIENT" && defaultDoctorId) {
      params.set("doctor", defaultDoctorId);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filteredThreads, selectedThreadId, router, pathname, role, defaultDoctorId]);

  const composerPlaceholder =
    role === "DOCTOR"
      ? "Write a reply to the patient..."
      : "Send a message to your doctor...";

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
              Advice Chat Workspace
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Select a conversation, review the latest messages, and continue the chat without leaving this page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={browseHref} className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700">
              {browseLabel}
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Open threads</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loadingThreads ? "..." : threads.length}</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Unread messages</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loadingThreads ? "..." : unreadCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Selected thread</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{selectedThread ? getPeerName(selectedThread, role) : "None"}</p>
          </div>
          <div className="hidden rounded-2xl border border-violet-100 bg-violet-50/80 p-4 xl:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Status</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{selectedThread?.status || "Idle"}</p>
          </div>
          <div className="hidden rounded-2xl border border-amber-100 bg-amber-50/80 p-4 xl:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Connection</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-500 animate-pulse' : wsStatus === 'Connecting...' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'}`}></span>
              <p className="text-xl font-bold text-slate-900">{wsStatus}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <aside className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Threads</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{role === "DOCTOR" ? "Patient conversations" : "Doctor conversations"}</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {threads.length}
              </span>
            </div>
            <div className="mt-4 relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or message"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="max-h-[620px] space-y-3 overflow-y-auto p-4 sm:p-5">
            {loadingThreads && threads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-600">
                Loading chats...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-600">
                No conversations match your search.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = String(thread.id) === String(selectedThreadId);
                const peerName = getPeerName(thread, role);

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectThread(thread.id)}
                    className={`w-full rounded-[1.35rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                      isActive
                        ? "border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100/40"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{peerName}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {thread.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {thread.unreadCount > 0 ? (
                          <span className="rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                            {thread.unreadCount}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            thread.status === "OPEN"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {thread.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>{formatTime(thread.last_message_at || thread.started_at)}</span>
                      {/* <span>{thread.thread_code}</span> */}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          {selectedThread ? (
            <>
              <div className="border-b border-cyan-100/80 bg-gradient-to-r from-cyan-50 to-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Conversation</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{getPeerName(selectedThread, role)}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {/* Thread {selectedThread.thread_code} · {formatTime(selectedThread.last_message_at || selectedThread.started_at)} */}
                      {formatTime(selectedThread.last_message_at || selectedThread.started_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedThread.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedThread.status}
                    </span>
                    {selectedThread.status === "OPEN" ? (
                      <WhiteButton onClick={() => void updateThreadStatus("close")} disabled={actionBusy} className="rounded-full px-4 py-2 text-sm">
                        Close thread
                      </WhiteButton>
                    ) : (
                      role === "DOCTOR" ? (
                        <GreenButton onClick={() => void updateThreadStatus("reopen")} disabled={actionBusy} className="rounded-full px-4 py-2 text-sm">
                          Reopen thread
                        </GreenButton>
                      ) : (
                        <GreenButton onClick={() => { if (selectedThread.doctor_id) void openOrCreatePatientThread(selectedThread.doctor_id); }} disabled={actionBusy} className="rounded-full px-4 py-2 text-sm">
                          Renew Consultation
                        </GreenButton>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="max-h-[540px] space-y-3 overflow-y-auto bg-gradient-to-b from-white to-emerald-50/40 p-4 sm:p-5">
                {loadingMessages ? (
                  <div className="rounded-2xl border border-dashed border-cyan-200 bg-white p-4 text-sm text-slate-600">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-cyan-200 bg-white p-4 text-sm text-slate-600">
                    No messages yet. Start the conversation below.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_role === role;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                            isOwnMessage
                              ? "bg-gradient-to-br from-emerald-600 to-green-600 text-white"
                              : "border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.message_text}</p>
                          {message.attachment && (
                            <div className="mt-2">
                              {message.attachment.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                <img src={message.attachment} alt="attachment" className="max-w-full rounded-xl max-h-60 object-cover" />
                              ) : (
                                <a href={message.attachment} target="_blank" rel="noreferrer" className="underline font-semibold text-xs">
                                  View Attachment
                                </a>
                              )}
                            </div>
                          )}
                          <p className={`mt-2 text-[11px] ${isOwnMessage ? "text-emerald-50" : "text-slate-500"}`}>
                            {formatTime(message.sent_at)}
                            {isOwnMessage ? " · You" : role === "DOCTOR" ? " · Patient" : " · Doctor"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              <div className="border-t border-emerald-100 bg-white p-4 sm:p-5">
                {selectedThread.status === "CLOSED" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    This thread is closed. Reopen it to continue the conversation.
                  </div>
                ) : null}
                <textarea
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  placeholder={composerPlaceholder}
                  rows={4}
                  disabled={selectedThread.status === "CLOSED"}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {selectedThread.status === "CLOSED"
                      ? "Closed threads cannot receive new messages until reopened."
                      : isExpired 
                      ? "This consultation ticket has expired."
                      : "Press send when you are ready."}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {(isExpired || selectedThread.status === "CLOSED") && role === "PATIENT" && (
                       <GreenButton onClick={() => { if (selectedThread.doctor_id) void openOrCreatePatientThread(selectedThread.doctor_id); }} disabled={actionBusy} className="rounded-full px-4 py-2 text-sm mr-2 whitespace-nowrap">
                         Renew Consultation
                       </GreenButton>
                    )}
                    {timeLeft && selectedThread.status === "OPEN" && !isExpired && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{timeLeft}</span>
                    )}
                    <label className={`flex items-center justify-center w-10 h-10 rounded-full transition cursor-pointer ${attachmentFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} ${isExpired || selectedThread.status === "CLOSED" ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input 
                        type="file" 
                        className="hidden" 
                        disabled={isExpired || selectedThread.status === "CLOSED"}
                        onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                      />
                      📎
                    </label>
                    
                    <GreenButton
                      onClick={() => void sendMessage()}
                      disabled={sending || selectedThread.status === "CLOSED" || isExpired || (!composer.trim() && !attachmentFile)}
                      className="rounded-full px-6 py-3"
                    >
                      {sending ? "Sending..." : "Send message"}
                    </GreenButton>
                  </div>
                </div>
                {attachmentFile && (
                  <div className="mt-2 text-xs text-emerald-600 font-semibold">
                    Attached: {attachmentFile.name} 
                    <button onClick={() => setAttachmentFile(null)} className="ml-2 text-rose-500 hover:underline">Remove</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[640px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                {role === "DOCTOR" ? "D" : "P"}
              </div>
              <div className="max-w-xl space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">{emptyStateTitle}</h3>
                <p className="text-sm leading-6 text-slate-600">{emptyStateDescription}</p>
              </div>
              <Link href={browseHref} className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700">
                {browseLabel}
              </Link>
            </div>
          )}
        </main>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {showPaymentModal && (
        <MockPaymentGateway
          amount={pendingPrice}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
          isProcessing={isProcessingPayment}
        />
      )}
    </section>
  );
}
