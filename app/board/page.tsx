"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NewsBoard from "./components/NewsBoard";
import Navbar from "../components/Navbar";
import Settings from "../mainApp/_components/settings/settings";
import { Member, Role } from "../mainApp/page";
import { useSearchParams } from "next/navigation";
import { useNavbar } from "../components/NavbarContext";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { useAuth } from "../_hooks/useAuth";
import firebase_app from "@/firebase";

const NewsBoardPage: React.FC = () => {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
 const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
 const [userRole, setUserRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const { isNavbarCollapsed } = useNavbar();
  const username = useAuth();
  const db = getFirestore(firebase_app);
  
  useEffect(() => {
      const fetchUserRole = () => {
        if (ownerUsername && workspaceId && username) {
          const memberRef = doc(
            db,
            "users",
            ownerUsername,
            "workspaces",
            workspaceId,
            "members",
            username
          );
          const unsubscribeFromMember = onSnapshot(
            memberRef,
            (memberSnapshot) => {
              const memberData = memberSnapshot.data();
              if (memberData) {
                const role = memberData.role;
  
                if (role) {
                  // Fetch data from workspaceId, "roles", userRole
                  const roleRef = doc(
                    db,
                    "users",
                    ownerUsername,
                    "workspaces",
                    workspaceId,
                    "roles",
                    role
                  );
                  const unsubscribeFromRole = onSnapshot(
                    roleRef,
                    (roleSnapshot) => {
                      const roleData = roleSnapshot.data();
                      if (roleData) {
                        setUserRole(roleData as Role);
                        sessionStorage.setItem(
                          "userRole",
                          JSON.stringify(roleData)
                        );
                      } else {
                        setUserRole(null);
                        sessionStorage.removeItem("userRole");
                      }
                    }
                  );
  
                  // Return cleanup function for role snapshot
                  return () => unsubscribeFromRole();
                } else {
                  setUserRole(null);
                  sessionStorage.removeItem("userRole");
                }
              }
            }
          );
  
          // Return cleanup function for member snapshot
          return () => unsubscribeFromMember();
        }
      };
  
      // Call fetchUserRole and store cleanup function
      const unsubscribe = fetchUserRole();
  
      // Cleanup function for useEffect
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [db, ownerUsername, workspaceId, username]);

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
      {(username === ownerUsername ||
            (userRole?.settingsView)) && (
        <Settings
          workspaceId={workspaceId || ""}
          ownerUsername={ownerUsername || ""}
          userRole={userRole as Role}
          members={members}
          />
      )}
    </>
  );
  
    return (
      <div className="min-h-screen flex bg-gray-100">
        <Navbar rightButtons={rightButtons} />
        <div className={`mt-12 ${
          isNavbarCollapsed ? "ml-16" : "ml-48"
        } transition-margin duration-300 p-4`}>
          <NewsBoard ownerUsername={ownerUsername} userRole={userRole as Role} />
        </div>
      </div>
    );
};

export default NewsBoardPage;
