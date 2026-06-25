"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock Data 
const mockEmployees = [
  { id: 1, name: "Rahul Sharma", role: "Frontend Developer" },
  { id: 2, name: "Aman Gupta", role: "Backend Developer" },
  { id: 3, name: "Priya Singh", role: "UI/UX Designer" }
];

export default function ManagerDashboard() {
  const router = useRouter();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleSubmitReview = (e) => {
    e.preventDefault();
    alert(`Review submitted for ${selectedEmployee?.name}!\nFeedback: ${feedback}`);
    setFeedback(""); 
    setSelectedEmployee(null); 
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
            {mockEmployees.map((emp) => (
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
            ))}
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