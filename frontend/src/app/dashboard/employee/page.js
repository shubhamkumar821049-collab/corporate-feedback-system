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

  // CHAT STATES
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
    
    // Auto-select assigned manager
    if (user.manager_id) {
      setSelectedManagerId(user.manager_id);
    }

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
        }
      })
      .catch((error) => console.error("Error fetching reviews:", error));

    // Fetch Managers (For Dropdown)
    fetch(`${API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setManagers(data.filter((u) => u.role === "Manager" && u.id === user.manager_id));
        }
      })
      .catch((err) => console.error("Error fetching managers:", err));

    // ==========================================
    // REAL-TIME CHAT FETCH (Short Polling)
    // ==========================================
    const fetchChats = () => {
      // cache-busting added: ?t=${Date.now()}
      fetch(`${API_URL}/api/chat/${user.id}?t=${Date.now()}`)
        .then((res) => {
          if (!res.ok) throw new Error("Backend API not ready");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setMyChats(data);
          }
        })
        .catch((err) => console.error("Error fetching chats:", err));
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000); // 3 seconds refresh
    return () => clearInterval(interval);

  }, [router]);

  const handleSubmitReply = async (reviewId) => {
    setReviews(reviews.map(rev => 
      rev.id === reviewId ? { ...rev, reply: replyText } : rev
    ));
    setReplyText("");
    setActiveReplyId(null);
    alert("Reply submitted locally!");
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
      } else {
        const errData = await response.json();
        alert(`Message Failed: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!loggedInUser) return null;

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
      <nav className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">💼</div>
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

      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-7 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">📈 My Performance Reviews</h2>
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.div variants={itemVariants} key={review.id} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                <div className="mb-5 pl-2">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                    <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md text-sm">From: {review.manager_name}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-[15px]">{review.feedback}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-5 space-y-6 flex flex-col">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40 flex flex-col h-[calc(100vh-140px)] sticky top-24">
            <div className="border-b border-gray-100 bg-gray-50/80 p-5 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">💬 Direct Messaging</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 custom-scrollbar">
              {[...myChats].reverse().map((chat, idx) => {
                const isMe = chat.sender_id === loggedInUser.id;
                return (
                  <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3.5 rounded-2xl max-w-[85%] shadow-sm ${isMe ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"}`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{chat.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 bg-white p-5 rounded-b-2xl">
              <form onSubmit={handleSendAnonymousMessage} className="space-y-3">
                <select required value={selectedManagerId} onChange={(e) => setSelectedManagerId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option value="">-- Assigned Manager --</option>
                  {managers.map(mgr => <option key={mgr.id} value={mgr.id}>{mgr.name}</option>)}
                </select>
                <div className="relative">
                  <textarea required rows="2" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type your secure message..." className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"></textarea>
                  <motion.button type="submit" className="absolute bottom-3 right-3 rounded-lg bg-emerald-600 p-2 text-white shadow-md transition hover:bg-emerald-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
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