"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [managerCode, setManagerCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (role === "Employee" && managerCode.trim() === "") {
      alert("Please enter Manager Code.");
      return;
    }

    setLoading(true);

    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      manager_code: role === "Employee" ? managerCode.trim().toUpperCase() : null,
    };

    try {
      const response = await fetch(API_URL + "/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to create account.");
        return;
      }

      if (role === "Manager") {
        alert("Account created successfully. Your Manager Code is " + data.manager_code);
      } else {
        alert("Account request sent. You can login after your manager approves it.");
      }

      router.push("/login");
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Unable to connect to the server.");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 px-4 py-8">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
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
          Create Account
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="mb-6 text-center text-sm text-gray-500"
        >
          Join CorpFeedback and start collaborating.
        </motion.p>

        <form onSubmit={handleSignup} className="space-y-5">
          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
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
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Register As
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

          {role === "Employee" && (
            <motion.div variants={itemVariants}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Manager Code
              </label>
              <input
                type="text"
                required
                value={managerCode}
                onChange={(e) => setManagerCode(e.target.value.toUpperCase())}
                placeholder="MGR-ABC123"
                className="w-full rounded-lg border border-gray-300 bg-white/70 p-2.5 uppercase text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the code shared by your manager.
              </p>
            </motion.div>
          )}

          {role === "Manager" && (
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700"
            >
              A unique Manager Code will be generated after signup. Share it
              only with employees who should join your workspace.
            </motion.div>
          )}

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
              {loading ? "Creating..." : "Sign Up"}
            </motion.button>
          </motion.div>
        </form>

        <motion.div
          variants={itemVariants}
          className="mt-6 text-center text-sm text-gray-600"
        >
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-medium text-green-600 transition hover:text-green-700 hover:underline"
          >
            Login here
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
