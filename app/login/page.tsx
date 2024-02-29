"use client";
import Link from "next/link";
import firebase_app from "../../firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const auth = getAuth(firebase_app);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      let userCredential;

      // if email contains @, use email to login
      if (email.includes("@")) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // else use username to login
      } else {
        const db = getFirestore(firebase_app);
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);

        // if username exists, login
        if (docSnap.exists()) {
          userCredential = await signInWithEmailAndPassword(
            auth,
            docSnap.data().email,
            password
          );
          // else throw error
        } else {
          setErrorMessage("Invalid username");
          return;
        }
      }
      setSuccessMessage("Login successful");
      setTimeout(() => {
        router.push("/workspaces");
      }, 2000);

      // handle errors
    } catch (error) {
      console.error(error);

      switch ((error as FirebaseError).code) {
        case "auth/invalid-credential":
          setErrorMessage("Invalid credentials");
          break;
        default:
          setErrorMessage("Failed login");
          break;
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 m-4 bg-white rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Login</h2>
          <Link
            href="/signup"
            className="text-blue-500 hover:text-blue-700  rounded-md px-2 py-2"
          >
            Register
          </Link>
        </div>
        <form onSubmit={login}>
          <input
            required
            type="text"
            placeholder="Email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className=" w-full p-2 mb-1 border border-gray-300  rounded-t-xl rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-2 border border-gray-300 rounded-md rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-center mb-2">
            <Link
              href="/resetPassword"
              className="w-full text-center text-blue-500 hover:text-blue-700 p-2"
            >
              Reset Password
            </Link>
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
          <div className=" text-center">
            {successMessage && (
              <>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center text-5xl bg-green-200 rounded-full text-green-500 w-16 h-16">
                    ✔
                  </span>
                </div>
                <div className="text-green-500 mt-2">{successMessage}</div>
              </>
            )}
            {!successMessage && errorMessage && (
              <>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center text-5xl bg-red-200 rounded-full text-red-500 w-16 h-16">
                    ✖
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
