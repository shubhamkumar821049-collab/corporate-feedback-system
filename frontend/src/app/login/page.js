"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";
import {
  clearLoggedInUser,
  routeForRole,
  storeLoggedInUser,
} from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearLoggedInUser();

    try {
      const response = await fetch(API_URL + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Invalid Email, Password, or Role. Please try again.");
        return;
      }

      storeLoggedInUser(data.user);
      alert("Welcome back, " + data.user.name + "!");
      router.replace(routeForRole(data.user.role));
    } catch (error) {
      console.error("Login Error:", error);
      alert("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-lg"
      >
        <motion.h2
          variants={itemVariants}
          className="mb-2 text-center text-3xl font-bold text-gray-800"
        >
          Welcome Back
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="mb-6 text-center text-sm text-gray-500"
        >
          Please sign in to your CorpFeedback account.
        </motion.p>

        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
              placeholder="you@company.com"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
              placeholder="Password"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Login As
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
            </select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={loading}
              className={
                "mt-2 w-full rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-all " +
                (loading
                  ? "cursor-not-allowed bg-green-400"
                  : "bg-green-600 hover:bg-green-700")
              }
            >
              {loading ? "Checking..." : "Sign In"}
            </motion.button>
          </motion.div>
        </form>

        <motion.div
          variants={itemVariants}
          className="mt-6 text-center text-sm text-gray-600"
        >
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="font-medium text-green-600 transition hover:text-green-700 hover:underline"
          >
            Sign Up here
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
