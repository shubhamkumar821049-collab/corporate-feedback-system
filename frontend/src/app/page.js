"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-6">
        <h1 className="text-2xl font-bold text-blue-600">CorpFeedback</h1>
        <div className="space-x-4">
          <button 
            onClick={() => router.push("/login")}
            className="text-gray-600 hover:text-blue-600 font-medium"
          >
            Login
          </button>
          <button 
            onClick={() => router.push("/signup")}
            className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
          Professional Feedback Simplified
        </span>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-6">
          Bridge the gap between <br />
          <span className="text-blue-600">Managers & Employees</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          A secure, anonymous, and real-time platform for corporate performance reviews 
          and open internal communication.
        </p>

        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/signup")}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg"
          >
            Create Your Workspace
          </button>
          <button 
            onClick={() => router.push("/login")}
            className="bg-gray-100 text-gray-800 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition"
          >
            Sign In
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 text-center text-gray-500">
        <p>© 2026 Corporate Feedback System. Built for productivity.</p>
      </footer>
    </div>
  );
}