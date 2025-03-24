"use client";
import firebase_app from "@/firebase";
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useContext } from "react";
import { Card, Member, Role } from "../mainApp/page";
import Navbar from "../components/Navbar";
import Settings from "../mainApp/_components/settings/settings";
import { useNavbar } from "../components/NavbarContext";
import { useAuth } from "../_hooks/useAuth";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";

const AssignViewPage: React.FC = () => {
  const db = getFirestore(firebase_app);
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [viewMode, setViewMode] = useState<"view" | "remove" | null>(null);
const dropdownRef = useRef<HTMLDivElement | null>(null);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isNavbarCollapsed } = useNavbar();
  const username = useAuth();
  const { notify } = useContext(NotificationContext);

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
    const storedUserRole = sessionStorage.getItem("userRole");
    const storedMembers = sessionStorage.getItem("members");
    const storedOwnerUsername = sessionStorage.getItem("ownerUsername");

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

  useEffect(() => {
    if (ownerUsername && workspaceId) {
      const membersCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "members"
      );
      const unsubscribe = onSnapshot(membersCollection, (snapshot) => {
        const membersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            username: data.username,
            role: data.role,
          } as Member;
        });
        setMembers(membersData);
      });

      return () => unsubscribe();
    }
  }, [db, ownerUsername, workspaceId]);

  useEffect(() => {
    if (selectedUser && ownerUsername && workspaceId && viewMode === "view") {
      const tilesCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "tiles"
      );
      const q = query(tilesCollection);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cardPromises = snapshot.docs.map(async (tileDoc) => {
          const cardCollection = collection(tileDoc.ref, "cards");
          const cardQuery = query(
            cardCollection,
            where("assignedTo", "array-contains", selectedUser)
          );
          const cardSnapshot = await getDocs(cardQuery);
          return cardSnapshot.docs.map((cardDoc) => ({
            id: cardDoc.id,
            ...cardDoc.data(),
          })) as Card[];
        });

        Promise.all(cardPromises).then((cardsArray) => {
          const allCards = cardsArray.flat();
          setCards(allCards);
        });
      });

      return () => unsubscribe();
    }
  }, [db, ownerUsername, workspaceId, selectedUser, viewMode]);

  const handleRemoveUser = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.removeMember) {
        console.log("You do not have permission to create posts.");
        notify("You do not have permission to create posts.", "error");
        return;
      }
    }
    if (selectedUser && ownerUsername && workspaceId) {
      const memberDocRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "members",
        selectedUser
      );
      await deleteDoc(memberDocRef);

      // Remove membership from the user's database
      const membershipsCollection = collection(
        db,
        "users",
        selectedUser,
        "memberships"
      );
      const membershipQuery = query(
        membershipsCollection,
        where("workspace", "==", workspaceId)
      );
      const membershipSnapshot = await getDocs(membershipQuery);
      membershipSnapshot.forEach(async (membershipDoc) => {
        await deleteDoc(membershipDoc.ref);
      });

      setMembers(members.filter((member) => member.username !== selectedUser));
      setSelectedUser(null);
      setViewMode(null);
    }
  };
  const handleViewAssignedCards = () => {
    if (userRole?.viewAssignedCards || username === ownerUsername) {
      setViewMode("view");
    } else {
      console.log("You do not have permission to create posts.");
      notify("You do not have permission to view assigned cards.", "error");
    }
  };

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
      <div
        className={`pt-16 ${
          isNavbarCollapsed ? "ml-16" : "ml-48"
        } transition-margin duration-300 flex max-h-screen flex-1 p-4`}
      >
        <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-md">
          <h1 className="text-2xl font-bold mb-4">Members</h1>
          <div className="mb-4">
            <label
              htmlFor="user-select"
              className="block text-lg font-medium text-gray-700"
            >
              Choose a user:
            </label>
            <div className="relative inline-block text-left ">
              <button
                className="mt-1 w-full pl-3 pr-10 py-2 border-gray-300 bg-sky-100 sm:text-md rounded-xl hover:bg-sky-200"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {selectedUser ? selectedUser : "Select a user"}
              </button>
              {isDropdownOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-full rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                  ref={dropdownRef}
                >
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    {members.map((member) => (
                      <div
                        key={member.username}
                        className={`cursor-pointer p-2 rounded-xl ${
                          selectedUser === member.username
                            ? "bg-sky-100 "
                            : "hover:bg-blue-200"
                        }`}
                        onClick={() => {
                          setSelectedUser(member.username);
                          setIsDropdownOpen(false);
                          setViewMode(null);
                        }}
                      >
                        {member.username}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {selectedUser && (
            <div className="mb-4 flex flex-col sm:flex-row">
              <button
                onClick={handleViewAssignedCards}
                className="mr-2 mb-2 sm:mb-0 px-4 py-2 bg-sky-100 rounded-xl hover:bg-blue-200"
              >
                View Assigned Cards
              </button>
              <button
                onClick={() => setViewMode("remove")}
                className="px-4 py-2 bg-red-100 rounded-xl hover:bg-red-200"
              >
                Remove User from Workspace
              </button>
            </div>
          )}
          {viewMode === "view" && (userRole?.viewAssignedCards || username === ownerUsername) && (
            <div>
              <h2 className="text-xl font-bold mb-2">Assigned Cards</h2>
              {cards.length > 0 ? (
                <ul className="space-y-4">
                  {cards.map((card) => (
                    <li key={card.id} className="p-4 bg-sky-200 rounded-2xl">
                      <h3 className="text-lg font-bold">{card.name}</h3>
                      <p>{card.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No cards assigned to this user.</p>
              )}
            </div>
          )}
          {viewMode === "remove" && (userRole?.removeMember || username === ownerUsername) && (
            <div>
              <h2 className="text-xl font-bold mb-2">Remove User</h2>
              <p className="mb-4">
                Are you sure you want to remove {selectedUser} from the
                workspace?
              </p>
              <button
                onClick={handleRemoveUser}
                className="px-4 py-2 bg-red-100 rounded-xl hover:bg-red-200"
              >
                Confirm Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignViewPage;
