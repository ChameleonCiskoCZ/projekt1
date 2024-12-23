"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
import { Member, Role } from "../mainApp/page";
import { useSearchParams } from "next/navigation";
import { useNavbar } from "./NavbarContext";

interface NavbarProps {
  rightButtons: React.ReactNode;
}



const Navbar: React.FC<NavbarProps> = ({ rightButtons }) => {
  const searchParams = useSearchParams();
    const workspaceId = searchParams.get("workspaceId");
  const { isNavbarCollapsed, setIsNavbarCollapsed } = useNavbar();

  useEffect(() => {
    const storedState = sessionStorage.getItem("isNavbarCollapsed");
    if (storedState !== null) {
      setIsNavbarCollapsed(JSON.parse(storedState));
    }
  }, []);

  const handleNavbarToggle = () => {
    const newState = !isNavbarCollapsed;
    setIsNavbarCollapsed(newState);
    sessionStorage.setItem("isNavbarCollapsed", JSON.stringify(newState));
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div
        className={`fixed top-0 left-0 flex flex-col space-y-4 bg-white shadow p-4 ${
          isNavbarCollapsed ? "w-16" : "w-48"
        }  h-screen z-50 transition-width duration-300`}
      >
        <button
          className="flex items-center justify-start p-2"
          onClick={handleNavbarToggle}
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
            href={`/mainApp?workspaceId=${workspaceId}`}
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-sky-100"
          >
            <i className="fas fa-home text-xl"></i>
            {!isNavbarCollapsed && <span>Board</span>}
          </Link>
          <Link
            href={`/board?workspaceId=${workspaceId}`}
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-sky-100"
          >
            <i className="fas fa-bell text-xl"></i>
            {!isNavbarCollapsed && <span>Announcements</span>}
          </Link>

          <Link
            href={`/chat?workspaceId=${workspaceId}`}
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-sky-100"
          >
            <i className="fas fa-message text-xl"></i>
            {!isNavbarCollapsed && <span>Chat</span>}
          </Link>
          <Link
            href="./workspaces"
            className=" flex items-center space-x-2 p-2 rounded-xl hover:bg-sky-100"
          >
            <i className="fas fa-briefcase text-xl"></i>
            {!isNavbarCollapsed && <span>Workspaces</span>}
          </Link>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        {/* Top Navbar */}
        <div className="fixed bg-white shadow w-full pl-48 h-12 top-0 left-0 z-40 flex items-center justify-end p-4">
          <div className="flex space-x-2">{rightButtons}</div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
