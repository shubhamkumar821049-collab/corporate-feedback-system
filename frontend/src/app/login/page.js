"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend se saare users fetch kar rahe hain
      const response = await fetch("http://127.0.0.1:8000/api/users");
      const users = await response.json();

      // Check kar rahe hain ki kya email, password aur role match karta hai
      const validUser = users.find(
        (u) => u.email === email && u.password === password && u.role === role
      );

      if (validUser) {
        // Agar user mil gaya, toh uski ID aur details browser memory mein save kar lo
        localStorage.setItem("loggedInUser", JSON.stringify(validUser));
        
        alert(`Welcome back, ${validUser.name}!`);

        // Role ke hisaab se sahi dashboard par bhej do
        if (validUser.role === "Manager") {
          router.push("/dashboard/manager");
        } else {
          router.push("/dashboard/employee");
        }
      } else {
        // Agar match nahi hua
        alert("Invalid Email, Password, or Role. Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Cannot connect to the server. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Sign In
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
              placeholder="you@company.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Login As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-4 w-full rounded-md px-4 py-2 text-white transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}