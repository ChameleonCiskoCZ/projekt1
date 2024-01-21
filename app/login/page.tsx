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
        router.push("/");
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
      <div className="w-full max-w-sm p-6 m-4 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Login</h2>
          <Link
            href="/signup"
            className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-700"
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
            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full p-2 mb-4 bg-blue-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          {successMessage && <p className="text-green-500">{successMessage}</p>}
        </form>
      </div>
    </div>
  );
}
