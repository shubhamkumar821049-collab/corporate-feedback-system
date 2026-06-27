"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  // NAYE CHAT STATES
  const [managers, setManagers] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [myChats, setMyChats] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      router.push("/login");
      return;
    }
    setLoggedInUser(user);

    // Fetch Reviews
    fetch(`${API_URL}/api/reviews/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formattedData = data.map((rev) => ({
            ...rev,
            manager_name: `Manager ID: ${rev.manager_id}`, 
            date: "Recent", 
            reply: null 
          }));
          setReviews(formattedData);
        } else {
          setReviews([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      });

    // Fetch Managers
    fetch(`${API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setManagers(data.filter((u) => u.role === "Manager"));
        }
      })
      .catch((err) => console.error("Error fetching managers:", err));

    // Fetch Inbox
    fetch(`${API_URL}/api/chat/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend API not ready");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setMyChats(data);
        } else {
          setMyChats([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching chats:", err);
        setMyChats([]);
      });

  }, [router]);

  const handleSubmitReply = async (reviewId) => {
    setReviews(reviews.map(rev => 
      rev.id === reviewId ? { ...rev, reply: replyText } : rev
    ));
    setReplyText("");
    setActiveReplyId(null);
    alert("Reply submitted locally! (Note: Backend update is needed to save this permanently in DB)");
  };

  const handleSendAnonymousMessage = async (e) => {
    e.preventDefault();
    if (!selectedManagerId || !chatMessage.trim()) return;

    const payload = {
      sender_id: loggedInUser.id,
      receiver_id: parseInt(selectedManagerId),
      message: chatMessage,
      sender_name: "Anonymous Employee" 
    };

    try {
     const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMyChats([...myChats, newMsg]); 
        setChatMessage(""); 
        alert("Anonymous message sent to Manager successfully!");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!loggedInUser) return null;

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-800">
      
      {/* Premium Navbar */}
      <nav className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
            💼
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">Employee Space</h1>
            <p className="text-xs text-emerald-100 font-medium">Welcome, {loggedInUser.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/anonymous-board")}
            className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/20 border border-white/20"
          >
            <span>🕵️‍♂️</span> Anonymous Board
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.removeItem("loggedInUser");
              router.push("/login");
            }}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold shadow-md transition hover:bg-red-600"
          >
            Logout
          </motion.button>
        </div>
      </nav>

      {/* Main Content Layout (2 Columns on Large Screens) */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        
        {/* LEFT COLUMN: REVIEWS SECTION */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-7 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">My Performance Reviews</h2>
          </div>

          <AnimatePresence>
            {reviews.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 text-center shadow-sm"
              >
                <span className="text-5xl mb-3 opacity-50">📝</span>
                <p className="font-medium">No reviews found yet.</p>
                <p className="text-sm">Your managers haven't left any feedback.</p>
              </motion.div>
            ) : (
              reviews.map((review) => (
                <motion.div 
                  variants={itemVariants}
                  key={review.id} 
                  className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 transition hover:shadow-2xl"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                  
                  {/* Manager's Feedback */}
                  <div className="mb-5 pl-2">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                      <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md text-sm">From: {review.manager_name}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded">{review.date}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-[15px]">
                      {review.feedback}
                    </p>
                  </div>

                  {/* Employee's Reply Section */}
                  <div className="ml-4 mt-4 border-l-2 border-emerald-100 pl-5">
                    {review.reply ? (
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <span>✓</span> Your Reply
                        </span>
                        <p className="text-gray-700 italic text-[15px]">"{review.reply}"</p>
                      </div>
                    ) : (
                      <div>
                        {activeReplyId === review.id ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 space-y-3"
                          >
                            <textarea
                              rows="3"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a professional response to this feedback..."
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-[15px] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 resize-none"
                            ></textarea>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitReply(review.id)}
                                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
                              >
                                Submit Response
                              </button>
                              <button
                                onClick={() => {
                                  setActiveReplyId(null);
                                  setReplyText("");
                                }}
                                className="rounded-lg bg-white border border-gray-300 px-5 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => setActiveReplyId(review.id)}
                            className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            ↳ Add a Response
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT COLUMN: ANONYMOUS CHAT SECTION */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 space-y-6 flex flex-col"
        >
          <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40 flex flex-col h-[calc(100vh-140px)] sticky top-24">
            
            {/* Chat Header */}
            <div className="border-b border-gray-100 bg-gray-50/80 p-5 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>💬</span> Direct Messaging
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Safe & encrypted. Your real name is hidden as "Anonymous Employee".</p>
            </div>
            
            {/* Inbox / Chat History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 custom-scrollbar">
              {myChats.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                  <span className="text-4xl mb-2">📭</span>
                  <p className="text-sm text-gray-500 font-medium">No messages yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Start a conversation below.</p>
                </div>
              ) : (
                [...myChats].reverse().map((chat, idx) => {
                  const isMe = chat.sender_id === loggedInUser.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={idx} 
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`p-3.5 rounded-2xl max-w-[85%] shadow-sm ${
                        isMe 
                        ? "bg-emerald-600 text-white rounded-br-sm shadow-emerald-600/20" 
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-gray-200/50"
                      }`}>
                        <div className="flex justify-between items-center mb-1.5 opacity-80">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-emerald-100" : "text-gray-500"}`}>
                            {isMe ? "Me (Anonymous)" : chat.sender_name}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{chat.message}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Chat Input Form */}
            <div className="border-t border-gray-100 bg-white p-5 rounded-b-2xl">
              <form onSubmit={handleSendAnonymousMessage} className="space-y-3">
                <select
                  required
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose a Manager to message --</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.email})</option>
                  ))}
                </select>
                
                <div className="relative">
                  <textarea
                    required
                    rows="2"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your secure message..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 pr-12 text-sm text-gray-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 custom-scrollbar"
                  ></textarea>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit" 
                    className="absolute bottom-3 right-3 rounded-lg bg-emerald-600 p-2 text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
                    title="Send Anonymously"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </motion.button>
                </div>
              </form>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}