// WorkspacePage.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, getFirestore, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot, getDoc } from "firebase/firestore"; // adjust the path according to your directory structure
import { useAuth } from "../_hooks/useAuth";
import firebase_app from "@/firebase";
//import { MainApp } from "../mainApp/page";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

type Workspace = {
  id: string;
  name: string;
  invites: {
    code: string;
    createdAt: string;
    usedBy?: string;
  }[];
  members?: string[]; // Optional: List of usernames with access
}


export default function WorkspacePage() {
  const db = getFirestore(firebase_app);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  /*const [workspaces, setWorkspaces] = useState<
    { id: string; [key: string]: any }[]
  >([]);*/
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const username = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isClicked, setIsClicked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if(username){
      const unsubscribeOwned = onSnapshot(
        collection(db, "users", username, "workspaces"),
        (querySnapshot) => {
          const workspaceList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            invites: doc.data().invites,
          }));
          setWorkspaces(workspaceList);
        }
      );

      // Fetch workspaces where the user is a member
      const unsubscribeMemberships = onSnapshot(
        collection(db, "users", username, "memberships"),
        async (querySnapshot) => {
          const membershipWorkspaceList = await Promise.all(
            querySnapshot.docs.map(async (membershipDoc) => {
              const workspaceRef = doc(
                db,
                "users",
                membershipDoc.data().user,
                "workspaces",
                membershipDoc.data().workspace
              );
              const workspaceDoc = await getDoc(workspaceRef);
              return {
                id: workspaceDoc.id,
                name: workspaceDoc.data()?.name,
                invites: workspaceDoc.data()?.invites,
              };
            })
          );
          setWorkspaces((prevWorkspaces) => [
            ...prevWorkspaces,
            ...membershipWorkspaceList,
          ]);
        }
      );

      // Unsubscribe on component unmount to avoid memory leaks
      return () => {
        unsubscribeOwned();
        unsubscribeMemberships();
      };
    }
  }, [db, username]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreateWorkspace = async () => {
    if (username) {
      const workspaceCollection = collection(
        db,
        "users",
        username,
        "workspaces"
      );
      const newWorkspaceRef = doc(workspaceCollection);
      await setDoc(newWorkspaceRef, {
        id: newWorkspaceRef.id,
        name: newWorkspaceName,
        invites: [], // Add the 'invites' property with an empty array
      });
      setWorkspaces([
        ...workspaces,
        { id: newWorkspaceRef.id, name: newWorkspaceName, invites: [] }, // Include the 'invites' property in the new workspace object
      ]);
      setNewWorkspaceName("");
      setIsClicked(false);
    }
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    //setSelectedWorkspaceId(workspaceId);
    router.push(`/mainApp?workspaceId=${workspaceId}`);
  };

  

  const [openWorkspaceId, setOpenWorkspaceId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef2 = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef2.current &&
        !buttonRef2.current.contains(event.target as Node)
      ) {
        setOpenWorkspaceId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as Element).getBoundingClientRect();

    setOpenWorkspaceId(id);
    setMenuPosition({
      top: rect.top,
      left: rect.left,
    });
  };

  // handle removing workspaces
  const handleRemoveWorkspace = async (id: string) => {
    if (username) {const workspaceRef = doc(db, "users", username, "workspaces", id);
      await deleteDoc(workspaceRef);
    }
    
  };
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null
  );

  const [newName, setNewName] = useState<string>("");
  const handleNameChange = async (id: string) => {
    if (username) {
      const workspaceRef = doc(db, "users", username, "workspaces", id);

      try {
        await updateDoc(workspaceRef, { name: newName });
        console.log("Workspace name updated successfully.");
        setEditingWorkspaceId(null);
        setNewName("");
      } catch (error) {
        console.error("Error updating workspace name: ", error);
      }
    }
  };
  const editFieldRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editFieldRef.current &&
        !editFieldRef.current.contains(event.target as Node)
      ) {
        setEditingWorkspaceId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const resizeTextArea = () => {
      if (editFieldRef.current) {
        editFieldRef.current.style.height = "28px";
        editFieldRef.current.style.height = `${editFieldRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (editFieldRef.current) {
      editFieldRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (editFieldRef.current) {
          editFieldRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [newName]);

  /*if (selectedWorkspaceId) {
    return <MainApp workspaceId={selectedWorkspaceId} />;
  }*/

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const handleCreateInvite = async (workspaceId: string) => {
    if (username) {
      const workspaceRef = doc(
        db,
        "users",
        username,
        "workspaces",
        workspaceId
      );
      try {
        const newInviteCode = uuidv4();
        setInviteCode(newInviteCode);
        const inviteData = {
          code: newInviteCode,
          createdAt: new Date().toISOString(),
        };
        await updateDoc(workspaceRef, {
          invites: arrayUnion(inviteData),
        });
        console.log("Invite code generated:", newInviteCode);
        // Display the invite code to the user
      } catch (error) {
        console.error("Error creating invite:", error);
      }
    }
  }
  const handleJoinWorkspace = async (inviteCode: string) => {
    if (username) {
      const usersRef = collection(db, "users"); // Reference to users collection

      // Get all user documents
      const querySnapshot = await getDocs(usersRef);

      querySnapshot.forEach(async (userDoc) => {

          // Access the workspaces subcollection within the user document
          const workspacesRef = collection(userDoc.ref, "workspaces");

          // Get all workspaces for the user
          const workspaceQuerySnapshot = await getDocs(workspacesRef);

          workspaceQuerySnapshot.forEach(async (workspaceDoc) => {
            
              const workspaceData = workspaceDoc.data() as Workspace;
              console.log("Checking workspace:", workspaceData.id); // Log workspace ID

              // Check if "invites" property exists before accessing it
              if (workspaceData.invites) {
                const matchingInvite = workspaceData.invites.find(
                  (invite) => invite.code === inviteCode
                );
                console.log(inviteCode);

                if (matchingInvite) {
                  const workspaceRef = doc(
                    db,
                    "users",
                    userDoc.id,
                    "workspaces",
                    workspaceData.id
                  );
                  try {
                    await updateDoc(workspaceRef, {
                      members: arrayUnion(username), // Add user to workspace members
                      invites: arrayRemove({ code: inviteCode }), // Remove used invite code
                    });
                    const membershipsRef = collection(
                      db,
                      "users",
                      username,
                      "memberships"
                    );
                    await addDoc(membershipsRef, {
                      user: userDoc.id,
                      workspace: workspaceData.id,
                    });
                    setWorkspaces((prevWorkspaces) =>
                      prevWorkspaces.map((ws) =>
                        ws.id === workspaceData.id ? workspaceData : ws
                      )
                    );
                    console.log("Joined workspace successfully!");
                  } catch (error) {
                    console.error("Error joining workspace:", error);
                  }
                } else {
                  console.log(
                    "Invite code not found for workspace:",
                    workspaceData.id
                  );
                }
              } else {
                console.log(
                  "Workspace",
                  workspaceDoc.id,
                  "has no invites property"
                );
              }
            
          });
        
      });
    }
  };
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-2xl p-4 font-bold mb-4">Select a Workspace</h1>
      <div className="flex self-start">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace.id)}
            className="p-2 bg-white hover:bg-sky-50 min-h-20 rounded-2xl shadow m-2 w-64 relative flex flex-col self-start"
          >
            <div className="flex justify-between items-center">
              {editingWorkspaceId === workspace.id ? (
                <textarea
                  ref={editFieldRef}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onBlur={() => handleNameChange(workspace.id)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleNameChange(workspace.id)
                  }
                  className="text-xl resize-none w-full p-0.5 pl-2 font-bold overflow-hidden break-words rounded-xl flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                />
              ) : (
                <div className="text-xl resize-none w-full p-0.5 pl-2 font-bold overflow-hidden break-words rounded-xl flex-grow cursor-pointer block">
                  <h2>{workspace.name}</h2>
                </div>
              )}
              <button
                ref={buttonRef2}
                onClick={(event) => handleButtonClick(workspace.id, event)}
                className="text-xl p-2.5 rounded-xl hover:bg-gray-100"
              >
                <span className="w-4 h-0.5 bg-black block mb-1 rounded-full"></span>
                <span className="w-4 h-0.5 bg-black block mb-1 rounded-full"></span>
                <span className="w-4 h-0.5 bg-black block rounded-full"></span>
              </button>
            </div>
            {openWorkspaceId === workspace.id &&
              ReactDOM.createPortal(
                <div
                  ref={menuRef}
                  style={{
                    position: "fixed",
                    ...menuPosition,
                  }}
                  className="mt-10 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    <button
                      onClick={() => handleRemoveWorkspace(workspace.id)}
                      className="block w-full rounded-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => {
                        setEditingWorkspaceId(workspace.id);
                        setNewName(workspace.name);
                        setTimeout(() => editFieldRef.current?.focus(), 0);
                      }}
                      className="block w-full rounded-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        handleCreateInvite(workspace.id);
                        togglePopup();
                      }}
                      className="block w-full rounded-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Invite User
                    </button>
                  </div>
                </div>,
                document.body
              )}
          </div>
        ))}

        <div
          onClick={() => setIsClicked(true)}
          ref={buttonRef}
          className={`self-start p-4 rounded-2xl shadow m-2 w-64 flex-shrink-0 relative ${
            isClicked
              ? "bg-white"
              : "bg-white shadow  hover:bg-sky-50  cursor-pointer"
          } ${isClicked ? "h-auto" : "min-h-20"} ${
            isClicked ? "" : "flex items-center justify-center"
          }`}
        >
          {isClicked ? (
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Enter workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault(); // Prevent form submission
                    handleCreateWorkspace();
                  }
                }}
                autoFocus
                className="mb-2 px-2 py-1 border-2 border-gray-200 rounded-xl w-full"
              />
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl w-full"
              >
                Create Workspace
              </button>
              <button
                onClick={() => handleJoinWorkspace(newWorkspaceName)}
                className="px-4 py-2 bg-green-500 text-white rounded-xl w-full mt-2"
              >
                Join Workspace
              </button>
            </div>
          ) : (
            <p className="text-4xl">+</p>
          )}
        </div>
      </div>
      <div>
        {isPopupOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={togglePopup}
          >
            <div
              className="bg-white rounded-2xl p-2 shadow flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between space-x-40 items-center font-bold text-lg mb-2">
                <p className="flex-grow p-0.5 pl-2 ml-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Invite new user
                </p>
                <button
                  className="m-1 p-4 ml-4 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100"
                  onClick={togglePopup}
                >
                  ✖
                </button>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <p className="font-bold text-lg">Your invite code</p>
                <p className="font-bold text-sm">{inviteCode}</p>
                <button
                  className="m-1 p-2 bg-green-300 hover:bg-green-500 text-white rounded-lg"
                  onClick={() =>
                    navigator.clipboard.writeText(inviteCode ?? "")
                  }
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
