"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
      role: role,
    };

    try {
      // Backend ke CREATE USER route par POST request
      const response = await fetch("http://127.0.0.1:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("Account created successfully! Please login.");
        router.push("/login");
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

  // Framer Motion Variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      {/* Signup Form Container (Glassmorphism Effect) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-lg border border-white/20"
      >
        <motion.h2 variants={itemVariants} className="mb-2 text-center text-3xl font-bold text-gray-800">
          Create Account
        </motion.h2>
        <motion.p variants={itemVariants} className="mb-6 text-center text-sm text-gray-500">
          Join CorpFeedback and start collaborating.
        </motion.p>

        <form onSubmit={handleSignup} className="space-y-5">
          {/* Name Input */}
          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 outline-none transition"
              placeholder="John Doe"
            />
          </motion.div>

          {/* Email Input */}
          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 outline-none transition"
              placeholder="you@company.com"
            />
          </motion.div>

          {/* Password Input */}
          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 outline-none transition"
              placeholder="••••••••"
            />
          </motion.div>

          {/* Role Dropdown */}
          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">Register As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 outline-none transition"
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
            </select>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={loading}
              className={`mt-2 w-full rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-all ${
                loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Creating..." : "Sign Up"}
            </motion.button>
          </motion.div>
        </form>

        {/* Back to Login Link */}
        <motion.div variants={itemVariants} className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-medium text-green-600 hover:text-green-700 hover:underline transition"
          >
            Login here
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}