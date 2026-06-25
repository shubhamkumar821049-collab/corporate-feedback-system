"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnonymousBoard() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // 1. Page load hote hi backend se saare messages fetch karna (GET)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/anonymous")
      .then((response) => response.json())
      .then((data) => {
        setMessages(data);
      })
      .catch((error) => console.error("Error fetching messages:", error));
  }, []);

  // 2. Naya message backend ko bhejna (POST)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Backend model ke hisaab se payload banana
    const payload = {
      message: newMessage
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const savedMsg = await response.json();
        // Database se save hokar aane ke baad UI update karna
        setMessages([...messages, savedMsg]);
        setNewMessage(""); // Input box clear karna
      } else {
        console.error("Failed to post message");
      }
    } catch (error) {
      console.error("Error posting message:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      
      {/* Navbar (Dark Theme) */}
      <nav className="flex items-center justify-between bg-gray-900 p-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕵️‍♂️</span>
          <h1 className="text-xl font-bold">Anonymous Board</h1>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="rounded bg-gray-700 px-4 py-2 text-sm transition hover:bg-gray-600"
        >
          Back to Login
        </button>
      </nav>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-3xl flex-1 p-6">
        
        {/* Warning / Info Banner */}
        <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200 text-sm text-blue-800">
          <strong>Note:</strong> Messages posted here are completely anonymous. No user data or IP addresses are tracked. Please maintain professional decorum.
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="mb-8 rounded-lg bg-white p-4 shadow-md border">
          <textarea
            required
            rows="3"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share an anonymous thought, feedback, or idea..."
            className="w-full resize-none rounded-md border border-gray-300 p-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          ></textarea>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded bg-gray-900 px-6 py-2 font-medium text-white transition hover:bg-gray-800"
            >
              Post Anonymously
            </button>
          </div>
        </form>

        {/* Messages Feed */}
        <div className="space-y-4">
          {/* Messages ko reverse kar rahe hain taaki naya message sabse upar dikhe */}
          {[...messages].reverse().map((msg, index) => (
            <div key={msg.id || index} className="rounded-lg border bg-white p-5 shadow-sm">
              {/* Backend se 'message' field aayega isliye msg.text ki jagah msg.message use kiya hai */}
              <p className="text-gray-800">{msg.message}</p>
              <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs text-gray-500">
                <span>👤 Anonymous User</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}