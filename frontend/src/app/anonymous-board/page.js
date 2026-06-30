"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function AnonymousBoard() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetch(`${API_URL}/api/anonymous`)
      .then((response) => response.json())
      .then((data) => {
        setMessages(data);
      })
      .catch((error) => console.error("Error fetching messages:", error));
  }, []);

  // Automatically scroll to bottom whenever messages array changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSubmitting(true);

    const payload = {
      message: newMessage,
    };

    try {
      const response = await fetch(`${API_URL}/api/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedMsg = await response.json();
        // Append new message to the end of the array
        setMessages([...messages, savedMsg]);
        setNewMessage("");
      } else {
        console.error("Failed to post message");
      }
    } catch (error) {
      console.error("Error posting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  };

  return (
    // h-screen and flex-col ensure the layout takes exactly the screen height
    <div className="flex h-screen flex-col bg-gray-50 font-sans text-gray-800 overflow-hidden">
      
      {/* Premium Dashboard Navbar (Emerald/Teal Gradient) */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-50 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 p-4 sm:p-5 text-white shadow-md flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-2 shadow-inner backdrop-blur-md">
            <span className="text-xl">🕵️‍♂️</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">The Whisper Room</h1>
            <p className="text-xs text-emerald-100 font-medium">100% Anonymous & Untraceable</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 shadow-sm"
        >
          Exit
        </motion.button>
      </motion.nav>

      {/* Messages Feed (WhatsApp Style Chat Area) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#f0f2f5]">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-10 mt-10 rounded-xl bg-white/60 border border-gray-200 mx-auto max-w-md"
            >
              <span className="text-4xl block mb-2 opacity-50">🤫</span>
              <p className="text-gray-500 font-medium text-sm">No whispers yet.</p>
              <p className="text-gray-400 text-xs">Be the first to share a thought!</p>
            </motion.div>
          ) : (
            // Removed the reverse() so older messages are at top, newest at bottom
            messages.map((msg, index) => (
              <motion.div 
                key={msg.id || index}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                layout 
                className="flex justify-start w-full"
              >
                {/* Message Bubble */}
                <div className="relative group max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tl-sm bg-white p-4 shadow-sm border border-gray-200">
                  <p className="text-[15px] sm:text-base leading-relaxed text-gray-800 whitespace-pre-wrap word-break">
                    {msg.message}
                  </p>
                  
                  {/* Timestamp / Meta data aligned right */}
                  <div className="mt-2 flex items-center justify-end gap-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Anonymous
                    </span>
                    {msg.id && (
                      <span className="opacity-50">
                        #{msg.id}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {/* Invisible div to scroll to bottom */}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* WhatsApp Style Input Area (Fixed at Bottom) */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 flex-shrink-0">
        <form 
          onSubmit={handleSendMessage} 
          className="mx-auto flex w-full max-w-5xl items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              required
              rows="1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              // Auto-expand textarea slightly on typing for better UX
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
              }}
              placeholder="Type your message here..."
              className="w-full resize-none rounded-2xl sm:rounded-full border border-gray-300 bg-gray-50 py-3 pl-4 pr-12 text-sm sm:text-base text-gray-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 max-h-[120px] overflow-y-auto custom-scrollbar"
              style={{ minHeight: "48px" }}
            ></textarea>
          </div>
          
          <motion.button
            whileHover={!isSubmitting ? { scale: 1.05 } : {}}
            whileTap={!isSubmitting ? { scale: 0.95 } : {}}
            type="submit"
            disabled={isSubmitting}
            className={`flex h-[48px] w-[48px] sm:w-auto sm:px-6 items-center justify-center gap-2 rounded-full font-bold text-white shadow-md transition-all flex-shrink-0 ${
              isSubmitting 
              ? "bg-emerald-400 cursor-wait" 
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg"
            }`}
          >
            <span className="hidden sm:inline">{isSubmitting ? "Sending..." : "Send"}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </motion.button>
        </form>
      </div>

    </div>
  );
}