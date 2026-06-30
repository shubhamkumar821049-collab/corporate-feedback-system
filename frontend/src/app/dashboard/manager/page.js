"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function ManagerDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // Past reviews state
  const [pastReviews, setPastReviews] = useState([]);

  // Chat states
  const [inbox, setInbox] = useState([]);
  const [replyText, setReplyText] = useState({}); 

  // ============================================================
  // CODE PASTED HERE: Naya Initial Data Fetch & Real-time Auto Refresh (Short Polling)
  // ============================================================
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      router.push("/login");
      return;
    }
    setLoggedInUser(user);

    // Employees list fetch (Sirf ek baar start mein)
    fetch(`${API_URL}/api/users`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const onlyEmployees = data.filter(u => u.role === "Employee");
          setEmployees(onlyEmployees);
        }
      })
      .catch((error) => console.error("Error fetching employees:", error));

    // Messages fetch karne ka function
    const fetchChats = () => {
      fetch(`${API_URL}/api/chat/${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Backend not ready yet");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setInbox(data); // Naye messages state mein set honge aur UI turant update hogi
          }
        })
        .catch((error) => console.error("Error fetching chats:", error));
    };

    // Pehli baar turant fetch karein
    fetchChats();

    // ⏳ Har 3 seconds mein background mein automatic fetch karein (No login/refresh needed!)
    const interval = setInterval(fetchChats, 3000);

    // Component unmount hone par interval ko saaf karein memory leak bachane ke liye
    return () => clearInterval(interval);

  }, [router]);

  // 2. Fetch Selected Employee Reviews
  useEffect(() => {
    if (selectedEmployee && loggedInUser) {
      fetch(`${API_URL}/api/reviews/${selectedEmployee.id}`)
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

  // 3. Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const reviewPayload = {
      manager_id: loggedInUser.id,
      employee_id: selectedEmployee.id,
      feedback: feedback
    };

    try {
     const response = await fetch(`${API_URL}/api/reviews`, {
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

  // 4. Reply to Anonymous Message
  const handleReplyToAnonymous = async (receiverId) => {
    const textToSend = replyText[receiverId];
    if (!textToSend || !textToSend.trim()) return;

    const payload = {
      sender_id: loggedInUser.id,
      receiver_id: receiverId,
      message: textToSend,
      sender_name: `${loggedInUser.name} (Manager)` 
    };

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newMsg = await response.json();
        setInbox([...inbox, newMsg]); 
        setReplyText({ ...replyText, [receiverId]: "" }); 
        alert("Reply sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  // 5. NAYA FEATURE: Delete Employee Handler
  const handleDeleteEmployee = async (employeeId, employeeName) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove ${employeeName} from the team?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert(`${employeeName} has been successfully removed.`);
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        
        if (selectedEmployee?.id === employeeId) {
          setSelectedEmployee(null);
          setPastReviews([]);
        }
      } else {
        alert("Failed to remove employee. Check backend.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Cannot connect to server to delete employee.");
    }
  };

  const handleCopyCode = () => {
    if (loggedInUser?.manager_code) {
      navigator.clipboard.writeText(loggedInUser.manager_code);
      alert("Manager Code copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <nav className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">📊</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manager Space</h1>
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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-8 md:grid-cols-12">
        <motion.div 
          initial="hidden" 
          animate="show"
          className="flex flex-col gap-6 md:col-span-4"
        >
          {/* MANAGER CODE DISPLAY */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-md">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800 uppercase tracking-wider">
              🔑 Your Manager Code
            </h2>
            <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
              <span className="text-xl font-mono font-bold text-emerald-700 tracking-widest pl-2">
                {loggedInUser ? loggedInUser.manager_code : "Loading..."}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyCode}
                className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                Copy
              </motion.button>
            </div>
            <p className="mt-3 text-xs text-emerald-600 font-medium leading-relaxed">
              Share this unique code with your employees. They will need it during sign up to join your team.
            </p>
          </div>

          {/* My Team Section */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/50">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              👥 My Team
            </h2>
            <ul className="space-y-3">
              {employees.length === 0 ? (
                <p className="text-gray-400 text-sm italic text-center py-4">No employees found.</p>
              ) : (
                employees.map((emp) => (
                  <motion.li 
                    whileHover={{ scale: 1.02 }}
                    key={emp.id}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-200 ${
                      selectedEmployee?.id === emp.id 
                      ? "border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500"
                      : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div 
                      onClick={() => setSelectedEmployee(emp)} 
                      className="cursor-pointer flex-1"
                    >
                      <div className="font-semibold text-gray-800">{emp.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{emp.email}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleDeleteEmployee(emp.id, emp.name);
                      }}
                      className="ml-2 rounded-full p-2 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
                      title={`Remove ${emp.name}`}
                    >
                      🗑️
                    </button>
                  </motion.li>
                ))
              )}
            </ul>
          </div>

          {/* Inbox Section */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/50">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              📩 Direct Messages
            </h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {inbox.filter(chat => chat.receiver_id === loggedInUser?.id).length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed">No incoming messages yet.</p>
              ) : (
                [...inbox]
                  .filter(chat => chat.receiver_id === loggedInUser?.id)
                  .reverse()
                  .map((chat, idx) => (
                    <div key={idx} className="rounded-2xl rounded-tl-none bg-emerald-50 p-4 shadow-sm border border-emerald-100">
                      <div className="mb-2 text-xs font-bold text-emerald-800 flex justify-between items-center">
                        <span>{employees.find(emp => emp.id === chat.sender_id)?.name || chat.sender_name}</span>
                      </div>
                      <p className="mb-4 text-sm text-gray-700 leading-relaxed">{chat.message}</p>
                      
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={replyText[chat.sender_id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [chat.sender_id]: e.target.value })}
                          placeholder="Type reply..."
                          className="w-full rounded-full border border-emerald-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReplyToAnonymous(chat.sender_id)}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md flex-shrink-0"
                        >
                          Send
                        </motion.button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column (Span 8) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 md:col-span-8 h-fit"
        >
          <AnimatePresence mode="wait">
            {selectedEmployee ? (
              <motion.div 
                key={selectedEmployee.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* WRITE REVIEW */}
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-gray-800">
                    Reviewing <span className="text-emerald-600 border-b-2 border-emerald-600 pb-1">{selectedEmployee.name}</span>
                  </h2>
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    <textarea
                      required
                      rows="5"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none shadow-inner"
                      placeholder="Detail their recent performance, achievements, or areas for growth..."
                    ></textarea>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 w-full md:w-auto"
                    >
                      Submit Official Review
                    </motion.button>
                  </form>
                </div>

                {/* PAST REVIEWS HISTORY */}
                <div className="border-t border-gray-100 pt-8">
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
                    🕒 Review History
                  </h3>
                  
                  <div className="space-y-5">
                    {pastReviews.length === 0 ? (
                      <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-300 text-center">
                        <span className="text-4xl block mb-2">📝</span>
                        <p className="text-gray-500 font-medium">No reviews submitted yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Start by writing your first review above.</p>
                      </div>
                    ) : (
                      [...pastReviews].reverse().map((rev, index) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          key={rev.id || index} 
                          className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-xl"></div>
                          <p className="text-gray-700 whitespace-pre-wrap pl-2 text-lg leading-relaxed">{rev.feedback}</p>
                          <div className="mt-4 flex justify-end items-center gap-2 border-t border-gray-50 pt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <span>ID: {rev.id}</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col h-[500px] items-center justify-center text-gray-400">
                <span className="text-7xl mb-4 opacity-50">👥</span>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">Select an Employee</h3>
                <p className="text-gray-500 text-center max-w-sm">Choose a team member from the left panel to write a review or view their past feedback history.</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}