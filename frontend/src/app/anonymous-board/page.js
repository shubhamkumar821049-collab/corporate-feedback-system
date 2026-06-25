"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock Data: Pehle se post kiye gaye anonymous messages
const initialMessages = [
  { 
    id: 1, 
    text: "The new coffee machine in the pantry is amazing! Good job HR team.", 
    time: "10:00 AM" 
  },
  { 
    id: 2, 
    text: "Can we have our weekly team sync-up on Fridays instead of Mondays?", 
    time: "11:30 AM" 
  },
  { 
    id: 3, 
    text: "Shoutout to the tech team for deploying the new update without any downtime! 🚀", 
    time: "1:15 PM" 
  }
];

export default function AnonymousBoard() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return; // Khali message send na ho

    // Current time nikalne ke liye
    const date = new Date();
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Naya message object banana
    const newMsgObj = {
      id: messages.length + 1,
      text: newMessage,
      time: timeString
    };

    // Purane messages ke aage naya message jodna
    setMessages([...messages, newMsgObj]);
    setNewMessage(""); // Input box clear karna
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      
      {/* Navbar (Dark Theme to look different) */}
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
          {/* Reverse use kar rahe hain taaki naye messages upar dikhein */}
          {[...messages].reverse().map((msg) => (
            <div key={msg.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-gray-800">{msg.text}</p>
              <div className="mt-3 border-t pt-2 flex items-center justify-between text-xs text-gray-500">
                <span>👤 Anonymous User</span>
                <span>{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}