"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  // Page load hote hi data fetch karna
  useEffect(() => {
    // 1. Browser memory se logged-in user nikalna
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      router.push("/login");
      return;
    }
    setLoggedInUser(user);

    // 2. Sirf us employee ke asli reviews mangwana
    fetch(`http://127.0.0.1:8000/api/reviews/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        // Data format karna taaki safely map ho sake
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

    // 3. Chat ke liye saare Managers ki list mangwana
    fetch("http://127.0.0.1:8000/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setManagers(data.filter((u) => u.role === "Manager"));
        }
      })
      .catch((err) => console.error("Error fetching managers:", err));

    // 4. Apne saare messages (Inbox) mangwana (SAFE VERSION TO PREVENT CRASH)
    fetch(`http://127.0.0.1:8000/api/chat/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend API not ready");
        return res.json();
      })
      .then((data) => {
        // Check karte hain ki jo data aaya hai wo sach mein Array (List) hai ya nahi
        if (Array.isArray(data)) {
          setMyChats(data);
        } else {
          setMyChats([]); // Agar list nahi hai, toh crash hone se bachane ke liye khali list daal do
        }
      })
      .catch((err) => {
        console.error("Error fetching chats:", err);
        setMyChats([]); // Error aane par bhi empty array set karo
      });

  }, [router]);

  // Review par reply karne ka function (Local)
  const handleSubmitReply = async (reviewId) => {
    setReviews(reviews.map(rev => 
      rev.id === reviewId ? { ...rev, reply: replyText } : rev
    ));
    setReplyText("");
    setActiveReplyId(null);
    alert("Reply submitted locally! (Note: Backend update is needed to save this permanently in DB)");
  };

  // NAYA: Manager ko Anonymous Message bhejna
  const handleSendAnonymousMessage = async (e) => {
    e.preventDefault();
    if (!selectedManagerId || !chatMessage.trim()) return;

    const payload = {
      sender_id: loggedInUser.id,
      receiver_id: parseInt(selectedManagerId),
      message: chatMessage,
      sender_name: "Anonymous Employee" // 🕵️‍♂️ Employee ka naam yahan hide ho gaya
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMyChats([...myChats, newMsg]); // UI mein naya message add karo
        setChatMessage(""); // Input clear karo
        alert("Anonymous message sent to Manager successfully!");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!loggedInUser) return null; // Jab tak user load na ho tab tak khali page dikhao

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-blue-600 p-4 text-white shadow-md">
        <h1 className="text-xl font-bold">Employee Dashboard</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/anonymous-board")}
            className="flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-sm transition hover:bg-gray-900"
          >
            <span>🕵️‍♂️</span> Anonymous Board
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem("loggedInUser");
              router.push("/login");
            }}
            className="rounded bg-red-500 px-4 py-2 text-sm transition hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-6">
        
        {/* SECTION 1: MY REVIEWS */}
        <h2 className="mb-6 text-2xl font-semibold text-gray-800">My Performance Reviews</h2>
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-md shadow-sm border">No reviews found from the database yet.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-lg border bg-white p-5 shadow-sm">
                
                {/* Manager's Feedback */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">From: {review.manager_name}</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="rounded bg-gray-50 p-3 text-gray-700 border">
                    {review.feedback}
                  </p>
                </div>

                {/* Employee's Reply Section */}
                <div className="ml-8 border-l-2 border-blue-200 pl-4">
                  {review.reply ? (
                    <div>
                      <span className="text-sm font-semibold text-blue-600">Your Reply:</span>
                      <p className="mt-1 text-gray-700 italic">"{review.reply}"</p>
                    </div>
                  ) : (
                    <div>
                      {activeReplyId === review.id ? (
                        <div className="mt-2 space-y-3">
                          <textarea
                            rows="3"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your response to this feedback..."
                            className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500"
                          ></textarea>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitReply(review.id)}
                              className="rounded bg-green-600 px-4 py-1 text-sm font-medium text-white transition hover:bg-green-700"
                            >
                              Send Reply
                            </button>
                            <button
                              onClick={() => {
                                setActiveReplyId(null);
                                setReplyText("");
                              }}
                              className="rounded bg-gray-300 px-4 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveReplyId(review.id)}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          ↳ Click to Reply
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* SECTION 2: ANONYMOUS DIRECT MESSAGING */}
        <div className="mt-10 rounded-lg border border-gray-300 bg-white p-6 shadow-md">
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Direct Message to Manager</h2>
          <p className="text-sm text-gray-500 mb-4">You can safely message managers here. Your real name will be hidden as "Anonymous Employee".</p>
          
          <form onSubmit={handleSendAnonymousMessage} className="space-y-4">
            <select
              required
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500"
            >
              <option value="">-- Select a Manager --</option>
              {managers.map(mgr => (
                <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.email})</option>
              ))}
            </select>
            
            <textarea
              required
              rows="3"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Write your message here..."
              className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500"
            ></textarea>
            
            <button type="submit" className="rounded bg-gray-900 px-6 py-2 font-medium text-white transition hover:bg-gray-800">
              Send Anonymously
            </button>
          </form>

          {/* Inbox showing conversation history */}
          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-gray-800 mb-4">My Inbox (Conversation History)</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {myChats.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No messages yet.</p>
              ) : (
                [...myChats].reverse().map((chat, idx) => {
                  // Check karein ki message humne bheja hai ya manager ne
                  const isMe = chat.sender_id === loggedInUser.id;
                  
                  return (
                    <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`p-3 rounded-lg border w-3/4 shadow-sm ${isMe ? "bg-blue-50 border-blue-200" : "bg-gray-100 border-gray-200"}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-600">
                            {isMe ? "Me (Anonymous)" : chat.sender_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{chat.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}