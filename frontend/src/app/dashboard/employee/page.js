"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";
import { clearLoggedInUser, validateStoredUser } from "@/lib/session";

const REFRESH_MS = 2500;

export default function EmployeeDashboard() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [assignedManager, setAssignedManager] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [myChats, setMyChats] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEmployeeData = useCallback(async (user, options = {}) => {
    if (!options.silent) setIsRefreshing(true);

    try {
      const cacheQuery = "?t=" + Date.now();
      const [reviewsResponse, managerResponse, chatsResponse] = await Promise.all([
        fetch(API_URL + "/api/reviews/" + user.id + cacheQuery, { cache: "no-store" }),
        fetch(API_URL + "/api/employee-manager/" + user.id + cacheQuery, { cache: "no-store" }),
        fetch(API_URL + "/api/chat/" + user.id + cacheQuery, { cache: "no-store" }),
      ]);

      const reviewData = reviewsResponse.ok ? await reviewsResponse.json() : [];
      const managerData = managerResponse.ok ? await managerResponse.json() : null;
      const chatData = chatsResponse.ok ? await chatsResponse.json() : [];

      setAssignedManager(managerData);
      setReviews(
        Array.isArray(reviewData)
          ? reviewData.map((review) => ({
              ...review,
              manager_name: managerData?.name || "Manager ID: " + review.manager_id,
            }))
          : []
      );
      setMyChats(Array.isArray(chatData) ? chatData : []);
    } catch (error) {
      console.error("Error refreshing employee data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let intervalId;

    async function startDashboard() {
      const user = await validateStoredUser({ router, expectedRole: "Employee" });
      if (!active || !user) return;

      setLoggedInUser(user);
      await loadEmployeeData(user);
      intervalId = setInterval(() => {
        loadEmployeeData(user, { silent: true });
      }, REFRESH_MS);
    }

    startDashboard();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadEmployeeData, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [myChats]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!assignedManager?.id || !loggedInUser?.id || !chatMessage.trim()) return;

    setIsSending(true);

    const payload = {
      sender_id: loggedInUser.id,
      receiver_id: assignedManager.id,
      message: chatMessage.trim(),
      sender_name: loggedInUser.name,
    };

    try {
      const response = await fetch(API_URL + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newMessage = await response.json();

      if (!response.ok) {
        alert("Message Failed: " + (newMessage.detail || "Please try again."));
        return;
      }

      setMyChats((current) => [...current, newMessage]);
      setChatMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Unable to send message right now.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    clearLoggedInUser();
    router.replace("/login");
  };

  if (!loggedInUser) return null;

  const orderedChats = [...myChats].sort((a, b) => (a.id || 0) - (b.id || 0));

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-800">
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-white shadow-lg">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight leading-tight">
            Employee Space
          </h1>
          <p className="text-xs font-medium text-emerald-100">
            Welcome, {loggedInUser.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/anonymous-board")}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/20"
          >
            Anonymous Board
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold shadow-md transition hover:bg-red-600"
          >
            Logout
          </motion.button>
        </div>
      </nav>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 p-6 lg:p-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-800">My Performance Reviews</h2>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
              {isRefreshing ? "Syncing" : "Auto refresh on"}
            </span>
          </div>

          <AnimatePresence>
            {reviews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm"
              >
                <p className="font-medium text-gray-500">No reviews yet.</p>
              </motion.div>
            ) : (
              reviews.map((review, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  key={`rev-${review.id || 'temp'}-${index}`}
                  className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-emerald-500" />
                  <div className="mb-5 pl-2">
                    <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="rounded-md bg-gray-100 px-3 py-1 text-sm font-bold text-gray-800">
                        From: {review.manager_name}
                      </span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-gray-700">
                      {review.feedback}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Quick Conversation</h2>
              <p className="text-xs font-medium text-gray-500">
                {assignedManager ? "With " + assignedManager.name : "Manager not assigned"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Live chat
            </span>
          </div>

          <div className="flex h-[560px] flex-col bg-[#eef5f0]">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {orderedChats.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm font-medium text-gray-500">
                  Start a quick conversation with your manager.
                </div>
              ) : (
                orderedChats.map((chat, index) => {
                  const isMe = chat.sender_id === loggedInUser.id;
                  return (
                    <div
                      key={`chat-${chat.id || 'temp'}-${index}`}
                      className={"flex " + (isMe ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={
                          "max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%] " +
                          (isMe
                            ? "rounded-br-sm bg-emerald-600 text-white"
                            : "rounded-bl-sm border border-gray-100 bg-white text-gray-800")
                        }
                      >
                        <p className="whitespace-pre-wrap">{chat.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <textarea
                  required
                  rows="1"
                  disabled={!assignedManager || isSending}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height =
                      (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + "px";
                  }}
                  placeholder="Type your message..."
                  className="max-h-[120px] min-h-[48px] w-full resize-none overflow-y-auto rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
                <motion.button
                  whileHover={!isSending ? { scale: 1.05 } : {}}
                  whileTap={!isSending ? { scale: 0.95 } : {}}
                  type="submit"
                  disabled={!assignedManager || isSending}
                  className="flex h-12 min-w-12 items-center justify-center rounded-full bg-emerald-600 px-5 font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isSending ? "Sending" : "Send"}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}