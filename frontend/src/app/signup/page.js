"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newUser = {
      name: name,
      email: email,
      password: password,
      role: role
    };

    try {
      // Backend ke CREATE USER route par POST request bhej rahe hain
      const response = await fetch("http://127.0.0.1:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        alert("Account created successfully! Please login.");
        router.push("/login"); // Account banne ke baad login par bhej do
      } else {
        alert("Failed to create account. This email might already exist.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Cannot connect to the server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Create Account
        </h2>
        
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 outline-none"
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
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Register As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 outline-none"
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
              loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button onClick={() => router.push("/login")} className="text-blue-600 hover:underline">
            Login here
          </button>
        </div>

      </div>
    </div>
  );
}