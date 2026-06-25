"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Abhi ke liye hum ek Manager ID (jaise Piyush ki ID: 1) use kar rahe hain
  // Baad mein yeh Login wale user ke data se aayega
  const CURRENT_MANAGER_ID = 1;

  // 1. Page load hote hi backend se asli users ka data fetch karna (GET)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users")
      .then((response) => response.json())
      .then((data) => {
        // Database se aane wale data mein se sirf "Employee" role walo ko filter karna
        const onlyEmployees = data.filter(user => user.role === "Employee");
        setEmployees(onlyEmployees);
      })
      .catch((error) => console.error("Error fetching employees:", error));
  }, []);

  // 2. Naya review backend ko bhejna (POST)
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    // Backend model ke hisaab se payload banana
    const reviewPayload = {
      manager_id: CURRENT_MANAGER_ID,
      employee_id: selectedEmployee.id,
      feedback: feedback
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewPayload),
      });

      if (response.ok) {
        alert(`Review successfully saved in Database for ${selectedEmployee?.name}!`);
        setFeedback(""); 
        setSelectedEmployee(null); 
      } else {
        alert("Failed to submit review. Please check the backend connection.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Server is not responding. Is the FastAPI server running?");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-blue-600 p-4 text-white shadow-md">
        <h1 className="text-xl font-bold">Manager Dashboard</h1>
        <button 
          onClick={() => router.push("/login")}
          className="rounded bg-red-500 px-4 py-2 text-sm transition hover:bg-red-600"
        >
          Logout
        </button>
      </nav>

      {/* Main Layout: 2 Columns */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 md:grid-cols-3">
        
        {/* Left Column: Employee List */}
        <div className="rounded-lg border bg-white p-4 shadow-md md:col-span-1">
          <h2 className="mb-4 border-b pb-2 text-lg font-semibold">My Team</h2>
          <ul className="space-y-2">
            {employees.length === 0 ? (
              <p className="text-gray-500 text-sm">No employees found in database.</p>
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
                  <div className="text-xs text-gray-500">{emp.role}</div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Right Column: Review Form */}
        <div className="min-h-[400px] rounded-lg border bg-white p-6 shadow-md md:col-span-2">
          {selectedEmployee ? (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                Write Review for <span className="text-blue-600">{selectedEmployee?.name}</span>
              </h2>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Performance Feedback
                  </label>
                  <textarea
                    required
                    rows="6"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe the employee's performance..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="rounded bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                >
                  Submit Review
                </button>
              </form>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <p>Please select an employee from the left list to write a review.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}