"use client";

import Link from "next/link";
import "@fortawesome/fontawesome-free/css/all.css";
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-white">
      {/* Header */}
      <header className="px-4 py-6 bg-white shadow">
        <nav className="container mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl text-blue-500">MyProject</h1>
          <ul className="flex items-center space-x-4">
            <li>
              <Link href="/login">
                <span className="text-blue-500 hover:text-blue-700">Login</span>
              </Link>
            </li>
            <li>
              <Link href="/signup">
                <span className="text-blue-500 hover:text-blue-700">
                  Signup
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center space-y-4 max-w-xl py-28 mx-auto">
          <h2 className="text-5xl font-extrabold text-blue-600">
            Welcome to MyProject
          </h2>
          <p className="px-4 text-lg text-gray-700">
            A collaborative platform to manage workspaces, invite team members,
            and streamline your workflow.
          </p>
          <div className="space-x-2 mt-6">
            <Link href="/login">
              <span className="inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Log In
              </span>
            </Link>
            <Link href="/signup">
              <span className="inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded">
                Sign Up
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">Features</h3>
          <div className="flex flex-wrap justify-center space-x-4 space-y-4">
            <div className="w-64 mt-4 ml-4 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-users text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Team Collaboration
              </h4>
              <p className="text-gray-600">
                Work together with your team in real-time.
              </p>
            </div>
            <div className="w-64 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-tasks text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Task Management
              </h4>
              <p className="text-gray-600">
                Organize and manage your tasks efficiently.
              </p>
            </div>
            <div className="w-64 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-chart-line text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Progress Tracking
              </h4>
              <p className="text-gray-600">
                Track your progress and stay on top of your goals.
              </p>
            </div>
            <div className="w-64 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-comments text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Chat System
              </h4>
              <p className="text-gray-600">
                Communicate with your team seamlessly.
              </p>
            </div>
            <div className="w-64 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-lock text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Permission Management
              </h4>
              <p className="text-gray-600">
                Control access and manage permissions easily.
              </p>
            </div>
            <div className="w-64 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-bullhorn text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Announcements
              </h4>
              <p className="text-gray-600">
                Keep everyone informed with important updates.
              </p>
            </div>
            <div className="w-64 p-4 bg-blue-50 rounded-lg shadow-md">
              <i className="fas fa-check-circle text-4xl text-blue-500 mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-800">
                Simplicity
              </h4>
              <p className="text-gray-600">
                Easy to use interface for a smooth experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-white text-center shadow-inner">
        <p className="text-gray-500">© 2025 MyProject. All rights reserved.</p>
      </footer>
    </div>
  );
}