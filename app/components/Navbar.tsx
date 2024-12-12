
import Link from "next/link";
import { useState } from "react";

interface NavbarProps {
  rightButtons: React.ReactNode;
}



const Navbar: React.FC<NavbarProps> = ({ rightButtons }) => {
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div
        className={`flex flex-col space-y-4 bg-white shadow p-4 ${
          isNavbarCollapsed ? "w-16" : "w-48"
        } h-full top-0 left-0 z-50 transition-width duration-300`}
      >
        <button
          className="flex items-center justify-start p-2"
          onClick={() => setIsNavbarCollapsed(!isNavbarCollapsed)}
        >
          <i
            className={`fas ${
              isNavbarCollapsed ? "fa-arrow-right" : "fa-arrow-left"
            }`}
          ></i>
        </button>
        <div
          className={`flex flex-col space-y-4 ${
            isNavbarCollapsed ? "items-center" : "items-start"
          }`}
        >
          <Link
            href="/mainapp"
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100"
          >
            <i className="fas fa-home text-xl"></i>
            {!isNavbarCollapsed && <span>Board</span>}
          </Link>
          <Link
            href="/news"
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100"
          >
            <i className="fas fa-bell text-xl"></i>
            {!isNavbarCollapsed && <span>Announcements</span>}
          </Link>
          <Link
            href="/workspaces"
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100"
          >
            <i className="fas fa-briefcase text-xl"></i>
            {!isNavbarCollapsed && <span>Workspaces</span>}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Top Navbar */}
        <div className="fixed bg-white shadow w-full pl-48 h-12 top-0 left-0 z-40 flex items-center justify-end p-4">
          <div className="flex space-x-2">{rightButtons}</div>
        </div>

        {/* Page Content 
          < div className="mt-12 ml-48 p-4">
        { Add your main content here 
        <p>Your content goes here...</p>
        </div>
        */}
      </div>
    </div>
  );
};

export default Navbar;
