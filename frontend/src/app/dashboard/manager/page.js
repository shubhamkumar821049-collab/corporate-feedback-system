"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // Past reviews state
  const [pastReviews, setPastReviews] = useState([]);

  // NAYE CHAT STATES (Inbox aur Replies ke liye)
  const [inbox, setInbox] = useState([]);
  const [replyText, setReplyText] = useState({}); // Har chat ke liye alag reply text store karega

  // 1. Page load hote hi User details, Employees, aur Inbox laana
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      router.push("/login");
      return;
    }
    setLoggedInUser(user);

    // Employees Fetch
    fetch("http://127.0.0.1:8000/api/users")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const onlyEmployees = data.filter(u => u.role === "Employee");
          setEmployees(onlyEmployees);
        }
      })
      .catch((error) => console.error("Error fetching employees:", error));

    // NAYA: Inbox Fetch (Safe version to avoid crash)
    fetch(`http://127.0.0.1:8000/api/chat/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend not ready yet");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setInbox(data);
        } else {
          setInbox([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
        setInbox([]);
      });

  }, [router]);

  // 2. Selected employee ke purane reviews fetch karna
  useEffect(() => {
    if (selectedEmployee && loggedInUser) {
      fetch(`http://127.0.0.1:8000/api/reviews/${selectedEmployee.id}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mySentReviews = data.filter(rev => rev.manager_id === loggedInUser.id);
            setPastReviews(mySentReviews);
          }
        })
        .catch(error => console.error("Error fetching past reviews:", error));
    }
  }, [selectedEmployee, loggedInUser]);

  // 3. Review Submit karna
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const reviewPayload = {
      manager_id: loggedInUser.id,
      employee_id: selectedEmployee.id,
      feedback: feedback
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload),
      });

      if (response.ok) {
        const savedReview = await response.json();
        alert(`Review successfully saved for ${selectedEmployee?.name}!`);
        setPastReviews([savedReview, ...pastReviews]);
        setFeedback("");
      } else {
        alert("Failed to submit review.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Cannot connect to server.");
    }
  };

  // 4. NAYA: Anonymous Message ka Reply Karna
  const handleReplyToAnonymous = async (receiverId) => {
    const textToSend = replyText[receiverId];
    if (!textToSend || !textToSend.trim()) return;

    const payload = {
      sender_id: loggedInUser.id,
      receiver_id: receiverId, // Jisne bheja tha, usko wapas bhej rahe hain
      message: textToSend,
      sender_name: `${loggedInUser.name} (Manager)` // Manager ka asli naam jayega
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newMsg = await response.json();
        setInbox([...inbox, newMsg]); // UI update
        setReplyText({ ...replyText, [receiverId]: "" }); // Box clear
        alert("Reply sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-blue-600 p-4 text-white shadow-md">
        <h1 className="text-xl font-bold">Manager Dashboard</h1>
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

      {/* Main Layout */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 md:grid-cols-3">
        
        {/* Left Column: Employee List & Inbox */}
        <div className="flex flex-col gap-6 md:col-span-1">
          
          {/* My Team Section */}
          <div className="rounded-lg border bg-white p-4 shadow-md h-fit">
            <h2 className="mb-4 border-b pb-2 text-lg font-semibold">My Team</h2>
            <ul className="space-y-2">
              {employees.length === 0 ? (
                <p className="text-gray-500 text-sm">No employees found.</p>
              ) : (
                employees.map((emp) => (
                  <li 
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`cursor-pointer rounded-md border p-3 transition ${
                      selectedEmployee?.id === emp.id 
                      ? "border-blue-400 bg-blue-50" 
                      : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-gray-800">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.email}</div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* NAYA SECTION: Manager's Direct Message Inbox */}
          <div className="rounded-lg border bg-white p-4 shadow-md h-fit">
            <h2 className="mb-4 border-b pb-2 text-lg font-semibold flex items-center gap-2">
              <span>📩</span> Direct Messages
            </h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {inbox.filter(chat => chat.receiver_id === loggedInUser?.id).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No incoming messages yet.</p>
              ) : (
                // Sirf wo messages jo Manager ko receive hue hain
                [...inbox]
                  .filter(chat => chat.receiver_id === loggedInUser?.id)
                  .reverse()
                  .map((chat, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
                      <div className="mb-1 text-xs font-bold text-gray-700">
                        From: <span className="text-blue-600">{chat.sender_name}</span>
                      </div>
                      <p className="mb-3 text-sm text-gray-800">{chat.message}</p>
                      
                      {/* Reply Section */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText[chat.sender_id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [chat.sender_id]: e.target.value })}
                          placeholder="Type your reply..."
                          className="w-full rounded-md border border-gray-300 p-1.5 text-sm outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleReplyToAnonymous(chat.sender_id)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Review Form & History */}
        <div className="rounded-lg border bg-white p-6 shadow-md md:col-span-2 h-fit">
          {selectedEmployee ? (
            <div className="space-y-8">
              
              {/* SECTION 1: WRITE REVIEW */}
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Write Review for <span className="text-blue-600">{selectedEmployee.name}</span>
                </h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <textarea
                    required
                    rows="4"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe the employee's performance..."
                  ></textarea>
                  <button
                    type="submit"
                    className="rounded bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                  >
                    Send Feedback
                  </button>
                </form>
              </div>

              {/* SECTION 2: PAST REVIEWS HISTORY */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Previous Feedback Sent</h3>
                
                <div className="space-y-4">
                  {pastReviews.length === 0 ? (
                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-md border">
                      You haven't sent any reviews to {selectedEmployee.name} yet.
                    </p>
                  ) : (
                    [...pastReviews].reverse().map((rev, index) => (
                      <div key={rev.id || index} className="rounded-md border bg-gray-50 p-4 shadow-sm">
                        <p className="text-gray-700 whitespace-pre-wrap">{rev.feedback}</p>
                        <div className="mt-2 text-xs text-gray-400 text-right">
                          Review ID: {rev.id}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center text-gray-400">
              <p>Please select an employee from the left list to write or view reviews.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}