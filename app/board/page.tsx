"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NewsBoard from "./components/NewsBoard";
import Navbar from "../components/Navbar";
import Settings from "../mainApp/_components/settings/settings";
import { Member, Role } from "../mainApp/page";
import { useSearchParams } from "next/navigation";
import { useNavbar } from "../components/NavbarContext";

const NewsBoardPage: React.FC = () => {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
 const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
 const [userRole, setUserRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const { isNavbarCollapsed } = useNavbar();

  useEffect(() => {
    const storedOwnerUsername = sessionStorage.getItem("ownerUsername");
    const storedUserRole = sessionStorage.getItem("userRole");
    const storedMembers = sessionStorage.getItem("members");

    if (storedOwnerUsername) {
      setOwnerUsername(storedOwnerUsername);
    }
    if (storedUserRole) {
      setUserRole(JSON.parse(storedUserRole));
    }
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    }
  }, []);
  

  const rightButtons = (
    <>
        <Settings
          workspaceId={workspaceId || ""}
          ownerUsername={ownerUsername || ""}
          userRole={userRole as Role}
          members={members}
        />
    </>
  );
  
    return (
      <div className="min-h-screen flex bg-gray-100">
        <Navbar rightButtons={rightButtons} />
        <div className={`mt-12 ${
          isNavbarCollapsed ? "ml-16" : "ml-48"
        } transition-margin duration-300 p-4`}>
          <h1 className="text-2xl font-bold mb-4">News Board</h1>
          <NewsBoard ownerUsername={ownerUsername} />
        </div>
      </div>
    );
};

export default NewsBoardPage;
