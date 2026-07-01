"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";
import { clearLoggedInUser, validateStoredUser } from "@/lib/session";

const REFRESH_MS = 2500;

export default function ManagerDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [pastReviews, setPastReviews] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [actionId, setActionId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadManagerData = useCallback(async (managerId, options = {}) => {
    if (!options.silent) setIsRefreshing(true);

    try {
      const cacheQuery = "?t=" + Date.now();
      const [pendingResponse, employeesResponse, chatsResponse] = await Promise.all([
        fetch(API_URL + "/api/pending/" + managerId + cacheQuery, { cache: "no-store" }),
        fetch(API_URL + "/api/employees/" + managerId + cacheQuery, { cache: "no-store" }),
        fetch(API_URL + "/api/chat/" + managerId + cacheQuery, { cache: "no-store" }),
      ]);

      const pendingData = pendingResponse.ok ? await pendingResponse.json() : [];
      const employeeData = employeesResponse.ok ? await employeesResponse.json() : [];
      const chatData = chatsResponse.ok ? await chatsResponse.json() : [];

      const approvedEmployees = Array.isArray(employeeData) ? employeeData : [];
      setPendingRequests(Array.isArray(pendingData) ? pendingData : []);
      setEmployees(approvedEmployees);
      setInbox(Array.isArray(chatData) ? chatData : []);
      setSelectedEmployee((current) => {
        if (!current) return current;
        return approvedEmployees.find((emp) => emp.id === current.id) || null;
      });
    } catch (error) {
      console.error("Error refreshing manager data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let intervalId;

    async function startDashboard() {
      const user = await validateStoredUser({ router, expectedRole: "Manager" });
      if (!active || !user) return;

      setLoggedInUser(user);
      await loadManagerData(user.id);
      intervalId = setInterval(() => {
        loadManagerData(user.id, { silent: true });
      }, REFRESH_MS);
    }

    startDashboard();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadManagerData, router]);

  useEffect(() => {
    if (!selectedEmployee?.id || !loggedInUser?.id) {
      setPastReviews([]);
      return;
    }

    let active = true;

    async function loadReviews() {
      try {
        const response = await fetch(
          API_URL + "/api/reviews/" + selectedEmployee.id + "?t=" + Date.now(),
          { cache: "no-store" }
        );
        const data = response.ok ? await response.json() : [];
        if (!active) return;

        const mySentReviews = Array.isArray(data)
          ? data.filter((review) => review.manager_id === loggedInUser.id)
          : [];
        setPastReviews(mySentReviews);
      } catch (error) {
        console.error("Error fetching past reviews:", error);
      }
    }

    loadReviews();
    const intervalId = setInterval(loadReviews, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [selectedEmployee?.id, loggedInUser?.id]);

  const handleApproveEmployee = async (employeeId) => {
    setActionId(employeeId);

    try {
      const response = await fetch(API_URL + "/api/approve/" + employeeId, {
        method: "PUT",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to approve employee.");
        return;
      }

      setPendingRequests((current) => current.filter((emp) => emp.id !== employeeId));
      setEmployees((current) => {
        const withoutDuplicate = current.filter((emp) => emp.id !== data.employee.id);
        return [...withoutDuplicate, data.employee].sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (error) {
      console.error("Error approving employee:", error);
      alert("Cannot connect to server to approve employee.");
    } finally {
      setActionId(null);
    }
  };

  const handleRejectEmployee = async (employeeId) => {
    setActionId(employeeId);

    try {
      const response = await fetch(API_URL + "/api/reject/" + employeeId, {
        method: "PUT",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to reject employee.");
        return;
      }

      setPendingRequests((current) => current.filter((emp) => emp.id !== employeeId));
    } catch (error) {
      console.error("Error rejecting employee:", error);
      alert("Cannot connect to server to reject employee.");
    } finally {
      setActionId(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!loggedInUser || !selectedEmployee) return;

    const reviewPayload = {
      manager_id: loggedInUser.id,
      employee_id: selectedEmployee.id,
      feedback: feedback.trim(),
    };

    try {
      const response = await fetch(API_URL + "/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload),
      });
      const savedReview = await response.json();

      if (!response.ok) {
        alert(savedReview.detail || "Failed to submit review.");
        return;
      }

      alert("Review successfully saved for " + selectedEmployee.name + ".");
      setPastReviews((current) => [...current, savedReview]);
      setFeedback("");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Cannot connect to server.");
    }
  };

  const handleReplyToAnonymous = async (receiverId) => {
    const textToSend = replyText[receiverId];
    if (!loggedInUser || !textToSend?.trim()) return;

    const payload = {
      sender_id: loggedInUser.id,
      receiver_id: receiverId,
      message: textToSend.trim(),
      sender_name: loggedInUser.name + " (Manager)",
    };

    try {
      const response = await fetch(API_URL + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newMessage = await response.json();

      if (!response.ok) {
        alert(newMessage.detail || "Reply failed.");
        return;
      }

      setInbox((current) => [...current, newMessage]);
      setReplyText((current) => ({ ...current, [receiverId]: "" }));
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove " + employeeName + " from the team?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(API_URL + "/api/users/" + employeeId, {
        method: "DELETE",
      });

      if (response.ok) {
        alert(employeeName + " has been successfully removed.");
        setEmployees((current) => current.filter((emp) => emp.id !== employeeId));

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

  const handleCopyCode = async () => {
    if (!loggedInUser?.manager_code) return;
    await navigator.clipboard.writeText(loggedInUser.manager_code);
    alert("Manager Code copied to clipboard.");
  };

  const handleLogout = () => {
    clearLoggedInUser();
    router.replace("/login");
  };

  if (!loggedInUser) return null;

  const incomingMessages = [...inbox]
    .filter((chat) => chat.receiver_id === loggedInUser.id)
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-800">
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manager Space</h1>
          <p className="text-xs font-medium text-emerald-100">
            Welcome, {loggedInUser.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/anonymous-board")}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/20"
          >
            Anonymous Board
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold shadow-md transition hover:bg-red-600"
          >
            Logout
          </motion.button>
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 lg:col-span-4"
        >
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-md">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                Your Manager Code
              </h2>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                {isRefreshing ? "Syncing" : "Live"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
              <span className="pl-2 font-mono text-xl font-bold tracking-widest text-emerald-700">
                {loggedInUser.manager_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="rounded-lg bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-200"
              >
                Copy
              </button>
            </div>
            <p className="mt-3 text-xs font-medium leading-relaxed text-emerald-600">
              Share this code only with employees who should join your workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xl shadow-gray-200/50">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800">Join Requests</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                {pendingRequests.length} pending
              </span>
            </div>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-5 text-center text-sm italic text-gray-400">
                  No pending requests.
                </p>
              ) : (
                pendingRequests.map((employee, index) => (
                  <div
                    key={`pending-${employee.id}-${index}`}
                    className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{employee.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{employee.email}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveEmployee(employee.id)}
                        disabled={actionId === employee.id}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-400"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectEmployee(employee.id)}
                        disabled={actionId === employee.id}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50 disabled:cursor-wait disabled:text-red-300"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/50">
            <h2 className="mb-4 text-lg font-bold text-gray-800">My Team</h2>
            <ul className="space-y-3">
              {employees.length === 0 ? (
                <p className="py-4 text-center text-sm italic text-gray-400">
                  No approved employees yet.
                </p>
              ) : (
                employees.map((employee, index) => (
                  <motion.li
                    whileHover={{ scale: 1.02 }}
                    key={`emp-${employee.id}-${index}`}
                    className={
                      "flex items-center justify-between rounded-xl border p-4 transition-all duration-200 " +
                      (selectedEmployee?.id === employee.id
                        ? "border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500"
                        : "border-gray-100 hover:border-gray-300 hover:bg-gray-50")
                    }
                  >
                    <button
                      onClick={() => setSelectedEmployee(employee)}
                      className="flex-1 cursor-pointer text-left"
                    >
                      <div className="font-semibold text-gray-800">{employee.name}</div>
                      <div className="mt-1 text-xs text-gray-500">{employee.email}</div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEmployee(employee.id, employee.name);
                      }}
                      className="ml-2 rounded-full px-3 py-2 text-sm font-bold text-red-500 transition hover:bg-red-100 hover:text-red-700"
                      title={"Remove " + employee.name}
                    >
                      Remove
                    </button>
                  </motion.li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/50">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Direct Messages</h2>
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
              {incomingMessages.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-gray-50 py-6 text-center text-sm italic text-gray-400">
                  No incoming messages yet.
                </p>
              ) : (
                incomingMessages.map((chat, index) => (
                  <div
                    key={`msg-${chat.id || 'temp'}-${index}`}
                    className="rounded-2xl rounded-tl-none border border-emerald-100 bg-emerald-50 p-4 shadow-sm"
                  >
                    <div className="mb-2 text-xs font-bold text-emerald-800">
                      {employees.find((employee) => employee.id === chat.sender_id)?.name || chat.sender_name}
                    </div>
                    <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {chat.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText[chat.sender_id] || ""}
                        onChange={(e) =>
                          setReplyText({ ...replyText, [chat.sender_id]: e.target.value })
                        }
                        placeholder="Type reply..."
                        className="w-full rounded-full border border-emerald-200 px-4 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReplyToAnonymous(chat.sender_id)}
                        className="flex-shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="h-fit rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 lg:col-span-8"
        >
          <AnimatePresence mode="wait">
            {selectedEmployee ? (
              <motion.div
                key={`selected-${selectedEmployee.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-gray-800">
                    Reviewing{" "}
                    <span className="border-b-2 border-emerald-600 pb-1 text-emerald-600">
                      {selectedEmployee.name}
                    </span>
                  </h2>
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    <textarea
                      required
                      rows="5"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-800 shadow-inner outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Detail their recent performance, achievements, or areas for growth..."
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full rounded-xl bg-emerald-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 md:w-auto"
                    >
                      Submit Official Review
                    </motion.button>
                  </form>
                </div>

                <div className="border-t border-gray-100 pt-8">
                  <h3 className="mb-6 text-xl font-bold text-gray-800">Review History</h3>
                  <div className="space-y-5">
                    {pastReviews.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                        <p className="font-medium text-gray-500">No reviews submitted yet.</p>
                        <p className="mt-1 text-sm text-gray-400">
                          Start by writing your first review above.
                        </p>
                      </div>
                    ) : (
                      [...pastReviews]
                        .sort((a, b) => (b.id || 0) - (a.id || 0))
                        .map((review, index) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.04 }}
                            key={`review-${review.id || 'temp'}-${index}`}
                            className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                          >
                            <div className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-xl bg-emerald-500" />
                            <p className="whitespace-pre-wrap pl-2 text-lg leading-relaxed text-gray-700">
                              {review.feedback}
                            </p>
                            <div className="mt-4 flex justify-end border-t border-gray-50 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                              ID: {review.id}
                            </div>
                          </motion.div>
                        ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center text-gray-400">
                <h3 className="mb-2 text-2xl font-bold text-gray-600">
                  Select an Employee
                </h3>
                <p className="max-w-sm text-center text-gray-500">
                  Choose an approved team member from the left panel to write a
                  review or view feedback history.
                </p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}