"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import firebase_app from "../../firebase";
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth(firebase_app);
  const router = useRouter();

  const register = async (event: React.FormEvent) => {
    event.preventDefault();

    //validate password
    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      setPasswordsMatch(false);
      return;
    } else {
      setPasswordsMatch(true);
    }

    // Create user

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setRegistrationSuccessful(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error(error);

      // Reset states
      setRegistrationSuccessful(false);

      // Handle error codes
      switch ((error as FirebaseError).code) {
        case "auth/email-already-in-use":
          setErrorMessage("User already exists");
          break;
        case "auth/invalid-email":
          setErrorMessage("Invalid email address");
          break;
        case "auth/weak-password":
          setErrorMessage("Password too weak");
          break;
        default:
          setErrorMessage("Failed registration");
          break;
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 m-4 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Account</h2>
          <Link
            href="/login"
            className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
        <div>
          <form onSubmit={register}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
            >
              Register
            </button>
            {!passwordsMatch && (
              <p className="text-red-500 mt-2">Passwords do not match</p>
            )}
            {registrationSuccessful && (
              <p className="text-green-500 mt-2">Registration successful</p>
            )}
            {errorMessage && (
              <p className="text-red-500 mt-2">{errorMessage}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
