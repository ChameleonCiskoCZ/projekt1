"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);
  return (
    <div className="flex min-h-screen bg-white">
      <div className="container mx-auto px-4">
        <nav className="flex justify-between py-6">
          <ul className="flex items-center space-x-4">
            <li>
              <Link href="/login" className="text-blue-500 hover:text-blue-700">
                Login
              </Link>
            </li>
            <li>
              <Link
                href="/signup"
                className="text-blue-500 hover:text-blue-700"
              >
                Signup
              </Link>
            </li>
          </ul>
        </nav>
        <h1 className="text-4xl font-bold mb-4">Lorem ipsum</h1>
        <p className="text-lg">Lorem ipsum</p>
      </div>
    </div>
  );
}
