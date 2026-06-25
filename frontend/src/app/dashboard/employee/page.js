"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock Data: Employee ko mile hue reviews
const initialReviews = [
  {
    id: 101,
    manager_name: "Shubham Sir",
    date: "2026-06-20",
    feedback: "Great work on the frontend layout! Your Next.js skills are improving fast.",
    reply: null // Abhi tak koi reply nahi diya
  },
  {
    id: 102,
    manager_name: "Shubham Sir",
    date: "2026-06-15",
    feedback: "Please make sure to document the UI components you are building.",
    reply: "Noted sir, I will add comments from the next sprint." // Pehle se reply de diya hai
  }
];

export default function EmployeeDashboard() {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null); // Kaunse review ka reply box open hai

  const handleSubmitReply = (reviewId) => {
    // Fake update: UI mein turant reply dikhane ke liye
    setReviews(reviews.map(rev => 
      rev.id === reviewId ? { ...rev, reply: replyText } : rev
    ));
    setReplyText("");
    setActiveReplyId(null);
    alert("Reply submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-blue-600 p-4 text-white shadow-md">
        <h1 className="text-xl font-bold">Employee Dashboard</h1>
        <button 
          onClick={() => router.push("/login")}
          className="rounded bg-red-500 px-4 py-2 text-sm transition hover:bg-red-600"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-6">
        <h2 className="mb-6 text-2xl font-semibold text-gray-800">My Reviews</h2>
        
        <div className="space-y-6">
          {reviews.map((review) => (
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
                  // Agar reply de chuke hain toh dikhao
                  <div>
                    <span className="text-sm font-semibold text-blue-600">Your Reply:</span>
                    <p className="mt-1 text-gray-700 italic">"{review.reply}"</p>
                  </div>
                ) : (
                  // Agar reply nahi diya hai toh Reply box dikhao
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
          ))}
        </div>
      </div>
    </div>
  );
}