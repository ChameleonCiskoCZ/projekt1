"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, sendPasswordResetEmail } from "firebase/auth"; 
import firebase_app from "@/firebase";
import Link from "next/link";
import { FirebaseError } from "firebase/app";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const auth = getAuth(firebase_app);

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email); 
      setSuccessMessage("Check your inbox for further instructions");
      setTimeout(() => {
        router.push("/login");
      }, 5000);
    } catch (error) {
      console.error(error);
      if ((error as FirebaseError).code == "auth/invalid-email") {
        setErrorMessage("Invalid email address");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 m-4 bg-white rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Reset password</h2>
          <Link
            href="/login"
            className="text-blue-500 hover:text-blue-700  rounded-md px-2 py-2"
          >
            Login
          </Link>
        </div>
        <form onSubmit={resetPassword}>
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className=" w-full p-2 mb-4 border border-gray-300  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset password
          </button>
          <div className=" text-center">
            {successMessage && (
              <>
                <div className="mt-4">
                  <span className="fas fa-check inline-flex items-center justify-center text-3xl bg-green-200 rounded-full text-green-500 p-4">
                    
                  </span>
                </div>
                <div className="text-green-500 mt-2">{successMessage}</div>
              </>
            )}
            {!successMessage && errorMessage && (
              <>
                <div className="mt-4">
                  <span className="fas fa-xmark inline-flex items-center justify-center text-3xl bg-red-200 rounded-full text-red-500 p-4">
                    
                  </span>
                </div>
                <div className="text-red-500 mt-2">{errorMessage}</div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
