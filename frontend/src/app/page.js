"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  // Framer Motion variants for smooth staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Ek ke baad ek element aayega
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image Container - Zoom out effect */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      </motion.div>

      {/* Navbar - Slide down effect */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex justify-between items-center px-10 py-6"
      >
        <h2 className="text-2xl font-bold text-green-600">CorpFeedback</h2>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/login")}
            className="text-gray-600 hover:text-green-600 font-medium transition"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="bg-green-600 text-white px-5 py-2 rounded-full font-medium hover:bg-green-700 transition"
          >
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* Hero Section - Staggered Fade Up */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6"
      >
        <motion.span
          variants={itemVariants}
          className="bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-semibold mb-4"
        >
          Professional Feedback Simplified
        </motion.span>
        
        <motion.h1
          variants={itemVariants}
          className="text-6xl font-extrabold text-gray-900 mb-6"
        >
          Bridge the gap between <br />
          <span className="text-green-600">Managers & Employees</span>
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-2xl mb-10"
        >
          A secure, anonymous, and real-time platform for corporate performance
          reviews and open internal communication.
        </motion.p>

        <motion.div variants={itemVariants} className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/signup")}
            className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg"
          >
            Create Your Workspace
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="bg-white text-gray-800 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-sm border"
          >
            Sign In
          </motion.button>
        </motion.div>
      </motion.main>

      {/* Footer - Simple Fade In */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="relative z-10 py-10 text-center text-gray-500"
      >
        <p>© 2026 Corporate Feedback System. Built for productivity.</p>
      </motion.footer>
    </div>
  );
}