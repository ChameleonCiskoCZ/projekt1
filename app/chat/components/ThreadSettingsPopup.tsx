import React, { useState, useEffect, useContext } from "react";
import { ChatThread } from "../page";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import firebase_app from "@/firebase";
import { Role } from "@/app/mainApp/page";
import { useAuth } from "@/app/_hooks/useAuth";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { on } from "events";

interface ThreadSettingsPopupProps {
  thread: ChatThread;
  onClose: () => void;
  ownerUsername: string;
  workspaceId: string;
  userRole: Role;
}

const ThreadSettingsPopup: React.FC<ThreadSettingsPopupProps> = ({
  thread,
  onClose,
  ownerUsername,
  workspaceId,
  userRole,
}) => {
  const db = getFirestore(firebase_app);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    thread.allowedRoles || []
  );
  const username = useAuth();
  const { notify } = useContext(NotificationContext);

  useEffect(() => {
    const fetchRoles = async () => {
      const rolesCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles"
      );
      const rolesSnapshot = await getDocs(rolesCollection);
      const rolesData = rolesSnapshot.docs.map((doc) => doc.data() as Role);
      setRoles(rolesData);
    };

    fetchRoles();
  }, [db, ownerUsername, workspaceId]);

  const handleRoleChange = (role: string) => {
    if (username !== ownerUsername) {
      if (!userRole?.changeChatPermissions) {
        console.log("You do not have permission to change chat permissions.");
        notify(
          "You do not have permission to change chat permissions.",
          "error"
        );
        return;
      }
    }
    setSelectedRoles((prevSelectedRoles) =>
      prevSelectedRoles.includes(role)
        ? prevSelectedRoles.filter((r) => r !== role)
        : [...prevSelectedRoles, role]
    );
  };

  const handleSave = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changeChatPermissions) {
        console.log("You do not have permission to change chat permissions.");
        notify(
          "You do not have permission to change chat permissions.",
          "error"
        );
        return;
      }
    }
    const threadRef = doc(
      db,
      "users",
      ownerUsername,
      "workspaces",
      workspaceId,
      "threads",
      thread.id
    );
    await updateDoc(threadRef, { allowedRoles: selectedRoles });
    onClose();
  };

  const handleRemoveThread = async () => {
    const threadRef = doc(
      db,
      "users",
      ownerUsername,
      "workspaces",
      workspaceId,
      "threads",
      thread.id
    );
    await deleteDoc(threadRef);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-4 mx-2 rounded-2xl shadow-lg w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-2xl py-1 px-2 hover:bg-sky-100 rounded-xl"
          onClick={onClose}
        >
          <i className="fas fa-xmark"></i>
        </button>
        <h2 className="text-xl font-bold mb-2">Thread Settings</h2>
        <div className="px-2 mb-4">
          <h3 className="text-lg font-semibold mb-2">Allowed Roles</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role.name} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => handleRoleChange(role.name)}
                  className="mr-2"
                />
                <span>{role.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleRemoveThread}
            className="px-4 py-2 bg-red-100 rounded-xl hover:bg-red-200"
          >
            Remove Thread
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-sky-100 rounded-xl hover:bg-sky-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadSettingsPopup;
