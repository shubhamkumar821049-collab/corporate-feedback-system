"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  // Abhi ke liye hum Adarsh ki ID (4) use kar rahe hain
  // Baad mein yeh Login wale user ki ID se replace ho jayega
  const CURRENT_EMPLOYEE_ID = 4;

  // 1. Page load hote hi asli reviews mangwana
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/reviews/${CURRENT_EMPLOYEE_ID}`)
      .then((response) => response.json())
      .then((data) => {
        // Backend ke data ko UI ke hisaab se format kar rahe hain
        const formattedData = data.map((rev) => ({
          ...rev,
          manager_name: `Manager ID: ${rev.manager_id}`, // Backend abhi sirf ID bhej raha hai
          date: "Recent", // Backend mein abhi date column nahi hai
          reply: null // Backend mein abhi reply column nahi hai
        }));
        setReviews(formattedData);
      })
      .catch((error) => console.error("Error fetching reviews:", error));
  }, []);

  const handleSubmitReply = async (reviewId) => {
    // UI mein turant reply dikhane ke liye local state update
    setReviews(reviews.map(rev => 
      rev.id === reviewId ? { ...rev, reply: replyText } : rev
    ));
    setReplyText("");
    setActiveReplyId(null);
    alert("Reply submitted locally! (Note: Backend update is needed to save this permanently in DB)");

    // TODO FOR BACKEND (Anish): 
    // Jab backend mein 'reply' column add ho jayega, tab yeh code chalega
    /*
    await fetch(`http://127.0.0.1:8000/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText })
    });
    */
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
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews found from the database yet.</p>
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
      </div>
    </div>
  );
}