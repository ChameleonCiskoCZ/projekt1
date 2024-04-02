// WorkspacePage.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, getFirestore, doc, deleteDoc, updateDoc } from "firebase/firestore"; // adjust the path according to your directory structure
import { useAuth } from "../_hooks/useAuth";
import firebase_app from "@/firebase";
import { MainApp } from "../mainApp/page";
import ReactDOM from "react-dom";

const WorkspacePage = () => {
  const db = getFirestore(firebase_app);
  const [workspaces, setWorkspaces] = useState<
    { id: string; [key: string]: any }[]
  >([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const username = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (username) {
        const workspaceCollection = collection(
          db,
          "users",
          username,
          "workspaces"
        );
        const workspaceSnapshot = await getDocs(workspaceCollection);
        const workspaceList = workspaceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWorkspaces(workspaceList);
      }
    };

    fetchWorkspaces();
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
      const newWorkspaceRef = await addDoc(workspaceCollection, {
        name: newWorkspaceName,
      });
      setWorkspaces([
        ...workspaces,
        { id: newWorkspaceRef.id, name: newWorkspaceName },
      ]);
      setNewWorkspaceName("");
      setIsClicked(false);
    }
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
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

  if (selectedWorkspaceId) {
    return <MainApp workspaceId={selectedWorkspaceId} />;
  }


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
            </div>
          ) : (
            <p className="text-4xl">+</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default WorkspacePage;
