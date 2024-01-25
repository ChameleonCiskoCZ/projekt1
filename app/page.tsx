import Link from "next/link";

export default function Home() {
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
        <h1 className="text-4xl font-bold mb-4">Welcome to our website!</h1>
        <p className="text-lg">Some information about the website...</p>
      </div>
    </div>
  );
}
