"use client"
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Member, Role } from "../mainApp/page";
import { useSearchParams } from "next/navigation";
import { useNavbar } from "./NavbarContext";
import { useAuth } from "../_hooks/useAuth";
import { useRouter } from "next/navigation";

interface NavbarProps {
  rightButtons: React.ReactNode;
}



const Navbar: React.FC<NavbarProps> = ({ rightButtons }) => {
  const searchParams = useSearchParams();
    const workspaceId = searchParams.get("workspaceId");
  const { isNavbarCollapsed, setIsNavbarCollapsed } = useNavbar();
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
   const [userRole, setUserRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const username = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
      const storedOwnerUsername = sessionStorage.getItem("ownerUsername");
      const storedUserRole = sessionStorage.getItem("userRole");
    const storedMembers = sessionStorage.getItem("members");
    const storedWorkspaceName = sessionStorage.getItem("workspaceName");

      if (storedOwnerUsername) {
        setOwnerUsername(storedOwnerUsername);
    }
    if (storedWorkspaceName) {
      setWorkspaceName(storedWorkspaceName);
    }
      if (storedUserRole) {
        setUserRole(JSON.parse(storedUserRole));
      }
      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
    }
    }, []);

  useEffect(() => {
    const storedState = sessionStorage.getItem("isNavbarCollapsed");
    if (storedState !== null) {
      setIsNavbarCollapsed(JSON.parse(storedState));
    }
  }, [setIsNavbarCollapsed]);

  const handleNavbarToggle = () => {
    const newState = !isNavbarCollapsed;
    setIsNavbarCollapsed(newState);
    sessionStorage.setItem("isNavbarCollapsed", JSON.stringify(newState));
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const toggleInfoMenu = () => {
    setShowInfoMenu((prev) => !prev);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setTimeout(() => {
      router.push("/login");
    }, 2000);
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
          {(username === ownerUsername || userRole?.membersView) && (
            <Link
              href={`/assignView?workspaceId=${workspaceId}`}
              className="flex items-center space-x-2 p-2 rounded-xl hover:bg-sky-100"
            >
              <i className="fas fa-user text-xl"></i>
              {!isNavbarCollapsed && <span>Members</span>}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1">
        {/* Top Navbar */}
        <div className="fixed bg-white shadow w-full h-12 top-0 left-0 z-40 flex items-center justify-between p-4">
          {/* Left side(large screens) */}
          <div
            className={`ml-16 hidden ${
              isNavbarCollapsed ? "ml-16" : "ml-48"
            } sm:block relative transition-all duration-300`}
          >
            <span
              className="font-bold text-lg cursor-default"
              onMouseEnter={() => setShowInfoMenu(true)}
              onMouseLeave={() => setShowInfoMenu(false)}
            >
              Workspace: {workspaceName}
            </span>
            {showInfoMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border rounded-xl shadow-sm p-2">
                <p className="text-sm">Owner: {ownerUsername}</p>
              </div>
            )}
          </div>
          {/* Right side */}
          <div className="flex items-center space-x-2">
            {rightButtons}
            <div className="ml-4">
              <div
                className="font-bold text-lg cursor-pointer ml-2"
                onClick={toggleProfileMenu}
              >
                {username}
              </div>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-sm">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-xl"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/*small screens*/}
        <div className="fixed bg-white shadow w-full pl-48 h-12 top-0 left-0 z-40 flex items-center justify-end p-4 sm:hidden">
          <div className="ml-4 mt-0.5 relative">
            <i
              className="fas fa-info-circle text-xl cursor-pointer hover:bg-sky-100 rounded-xl p-2 mx-2"
              onClick={toggleInfoMenu}
            ></i>
            {showInfoMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border rounded-xl shadow-sm p-2">
                <p className="text-sm font-semibold">
                  Workspace: {workspaceName}
                </p>
                <p className="text-sm">Owner: {ownerUsername}</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {rightButtons}
            <div className="">
              <div
                className="font-bold text-lg cursor-pointer ml-2"
                onClick={toggleProfileMenu}
              >
                {username}
              </div>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-sm">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-xl"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
