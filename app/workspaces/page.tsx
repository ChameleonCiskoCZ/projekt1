// WorkspacePage.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, getFirestore } from "firebase/firestore"; // adjust the path according to your directory structure
import { useAuth } from "../_hooks/useAuth";
import firebase_app from "@/firebase";
import { MainApp } from "../mainApp/page";

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
            {workspace.name}
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
