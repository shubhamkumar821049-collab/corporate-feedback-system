"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AnonymousBoard() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/anonymous")
      .then((response) => response.json())
      .then((data) => {
        setMessages(data);
      })
      .catch((error) => console.error("Error fetching messages:", error));
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSubmitting(true);

    const payload = {
      message: newMessage,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedMsg = await response.json();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, type: "spring" } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] font-sans text-gray-200">
      
      {/* Premium Dark Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-[#0a0a0f]/90 p-5 backdrop-blur-md shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-cyan-500/10 p-2 shadow-inner border border-cyan-500/30">
            <span className="text-xl">🕵️‍♂️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">The Whisper Room</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          className="rounded-full border border-gray-700 bg-gray-800 px-5 py-2 text-sm font-bold text-gray-300 transition hover:bg-gray-700 hover:text-white"
        >
          Exit Board
        </motion.button>
      </motion.nav>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-3xl flex-1 p-6 sm:p-10">
        
        {/* Warning / Info Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 rounded-2xl border border-cyan-900/50 bg-cyan-950/30 p-5 shadow-lg"
        >
          <p className="text-sm text-cyan-100 leading-relaxed font-medium">
            <strong className="text-cyan-400">🔒 100% Anonymous:</strong> Messages posted here are completely untraceable. No user data, names, or IPs are tracked. Please maintain professional decorum.
          </p>
        </motion.div>

        {/* Message Input Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSendMessage} 
          className="mb-12 rounded-3xl border border-gray-800 bg-[#12121a] p-6 shadow-2xl"
        >
          <textarea
            required
            rows="4"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full resize-none rounded-2xl border border-gray-700 bg-[#0a0a0f] p-5 text-xl font-medium text-white placeholder-gray-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 custom-scrollbar"
          ></textarea>
          <div className="mt-4 flex justify-end">
            <motion.button
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-full px-8 py-3 font-bold text-[#0a0a0f] shadow-lg transition-all ${
                isSubmitting 
                ? "bg-cyan-700 cursor-wait text-gray-300" 
                : "bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              }`}
            >
              {isSubmitting ? "Posting..." : "Drop Message 🚀"}
            </motion.button>
          </div>
        </motion.form>

        {/* Messages Feed */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-10 text-gray-500 italic font-medium"
              >
                No whispers yet. Be the first to share a thought!
              </motion.div>
            ) : (
              [...messages].reverse().map((msg, index) => (
                <motion.div 
                  key={msg.id || index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  layout 
                  // Extra dark card with prominent border for max focus on text
                  className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-[#111118] p-7 shadow-2xl transition-colors hover:border-cyan-500/50"
                >
                  {/* Glowing neon accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cyan-400 to-indigo-600 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  
                  {/* Highly visible text: Bada, bold, aur bright white */}
                  <div className="pl-3">
                    <p className="text-xl md:text-2xl leading-relaxed text-gray-50 font-semibold tracking-wide drop-shadow-md whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                  
                  {/* Bottom metadata */}
                  <div className="mt-6 flex items-center justify-between border-t border-gray-800/80 pt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                      Anonymous
                    </span>
                    {msg.id && (
                      <span className="bg-[#0a0a0f] border border-gray-800 px-3 py-1 rounded-md text-gray-500">
                        ID: #{msg.id}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}