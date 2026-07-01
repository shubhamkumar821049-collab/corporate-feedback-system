"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";
import { routeForRole, validateStoredUser } from "@/lib/session";

const REFRESH_MS = 2500;

export default function AnonymousBoard() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMessages = useCallback(async (options = {}) => {
    if (!options.silent) setIsRefreshing(true);

    try {
      const response = await fetch(API_URL + "/api/anonymous?t=" + Date.now(), {
        cache: "no-store",
      });
      const data = response.ok ? await response.json() : [];
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let intervalId;

    async function startBoard() {
      const user = await validateStoredUser({ router });
      if (!active || !user) return;

      setLoggedInUser(user);
      await loadMessages();
      intervalId = setInterval(() => {
        loadMessages({ silent: true });
      }, REFRESH_MS);
    }

    startBoard();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadMessages, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL + "/api/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      const savedMessage = await response.json();

      if (!response.ok) {
        alert(savedMessage.detail || "Failed to post message.");
        return;
      }

      setMessages((current) => [...current, savedMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Error posting message:", error);
      alert("Unable to post message right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exitBoard = () => {
    if (loggedInUser?.role) {
      router.replace(routeForRole(loggedInUser.role));
      return;
    }
    router.replace("/login");
  };

  if (!loggedInUser) return null;

  const orderedMessages = [...messages].sort((a, b) => (a.id || 0) - (b.id || 0));

  return (
    <div className="relative flex h-screen flex-col overflow-hidden font-sans text-gray-800">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      </div>

      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-shrink-0 items-center justify-between px-6 py-5 text-gray-900 lg:px-10"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-green-600">
            Anonymous Board
          </h1>
          <p className="text-xs font-semibold text-gray-500">
            {isRefreshing ? "Syncing messages" : "Live workspace board"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exitBoard}
          className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-green-700"
        >
          Exit
        </motion.button>
      </motion.nav>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 pb-5 sm:px-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-2xl backdrop-blur-lg">
          <div className="border-b border-gray-100 bg-white/80 p-4 sm:p-5">
            <h2 className="text-lg font-bold text-gray-800">The Whisper Room</h2>
            <p className="text-xs font-medium text-gray-500">
              Posts are saved to the backend database.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#eef5f0] p-4 sm:p-6">
            <AnimatePresence>
              {orderedMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-auto mt-10 max-w-md rounded-xl border border-gray-200 bg-white/70 py-10 text-center"
                >
                  <p className="text-sm font-medium text-gray-500">No messages yet.</p>
                  <p className="mt-1 text-xs text-gray-400">Be the first to share a thought.</p>
                </motion.div>
              ) : (
                orderedMessages.map((message, index) => (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex w-full justify-start"
                  >
                    <div className="relative max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white p-4 shadow-sm sm:max-w-[70%]">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 sm:text-base">
                        {message.message}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>Anonymous</span>
                        {message.id && <span className="opacity-50">#{message.id}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
            <form onSubmit={handleSendMessage} className="flex w-full items-end gap-2">
              <textarea
                required
                rows="1"
                value={newMessage}
                disabled={isSubmitting}
                onChange={(e) => setNewMessage(e.target.value)}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + "px";
                }}
                placeholder="Type your anonymous message..."
                className="max-h-[120px] min-h-[48px] w-full resize-none overflow-y-auto rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 disabled:cursor-wait disabled:bg-gray-100 sm:text-base"
              />
              <motion.button
                whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 min-w-12 items-center justify-center rounded-full bg-emerald-600 px-5 font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-400"
              >
                {isSubmitting ? "Sending" : "Send"}
              </motion.button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
