import { useContext, useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.css";
import {
  doc,
  setDoc,
  updateDoc,
  getFirestore,
  collection,
  getDocs,
  getDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import firebase_app from "@/firebase";
import Switch from "react-switch";
import { useAuth } from "@/app/_hooks/useAuth";
import { Member, Role } from "../../page";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";

interface UserInfo {
  ownerUsername: string;
  workspaceId: string;
  userRole: Role;
  members: Member[];
}

const Settings: React.FC<UserInfo> = ({ ownerUsername, workspaceId, userRole, members }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Roles");
  const [newRoleName, setNewRoleName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [moveCardPermission, setMoveCardPermission] = useState(false);
  const [addRemoveCardPermission, setAddRemoveCardPermission] = useState(false);
  const [addRemoveRolePermission, setAddRemoveRolePermission] = useState(false);
  const [changePermissionsPermission, setChangePermissionsPermission] = useState(false);
  const [moveTilePermission, setMoveTilePermission] =
    useState(false);
  const [addRemoveTilePermission, setAddRemoveTilePermission] = useState(false);
  const [assignCardPermission, setAssignCardPermission] = useState(false);
  const db = getFirestore(firebase_app);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const username = useAuth();
  const { notify } = useContext(NotificationContext);
  

 

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
  };

  const handleAssignRole = async (role: Role) => {
    if (selectedMember) {
      const memberRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "members",
        selectedMember.username
      );
      await updateDoc(memberRef, { role: role.name });

      // Update selectedMember state
      setSelectedMember((prevState) => {
        if (prevState) {
          return {
            ...prevState,
            role: role.name,
          };
        }
        return null;
      });
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setSelectedRole(null);
    setSelectedMember(null);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      console.log("Role name cannot be empty.");
      notify("Role name cannot be empty.", "error");
      return;
    }
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveRole) {
        console.log("You do not have permission to create roles.");
        notify("You do not have permission to create roles.", "error");
        return;
      }
    }
    const roleRef = doc(
      db,
      "users",
      ownerUsername,
      "workspaces",
      workspaceId,
      "roles",
      newRoleName
    );

    const roleSnapshot = await getDoc(roleRef);
    if (roleSnapshot.exists()) {
      console.log("Role already exists");
      setNewRoleName("");
      return;
    }

    await setDoc(roleRef, {
      name: newRoleName,
      changePermissions: false,
      addRemoveRole: false,
      moveCard: false,
      addRemoveCard: false,
    });
    setNewRoleName("");
  };

  useEffect(() => {
    const rolesCollection = collection(
      db,
      "users",
      ownerUsername,
      "workspaces",
      workspaceId,
      "roles"
    );
    const unsubscribe = onSnapshot(rolesCollection, (snapshot) => {
      setRoles(
        snapshot.docs.map((doc) => ({
          ...(doc.data() as Role),
        }))
      );
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [db, ownerUsername, workspaceId]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setMoveCardPermission(role.moveCard);
  };

  const handleToggleMoveCardPermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !moveCardPermission;
      setMoveCardPermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { moveCard: updatedPermission });
    }
  };

  const handleToggleAddRemoveCardPermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !addRemoveCardPermission;
      setAddRemoveCardPermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { addRemoveCard: updatedPermission });
    }
  };

  const handleToggleAddRemoveRolePermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !addRemoveRolePermission;
      setAddRemoveRolePermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { addRemoveRole: updatedPermission });
    }
  };

  const handleToggleChangePermissionsPermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !changePermissionsPermission;
      setChangePermissionsPermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { changePermissions: updatedPermission });
    }
  };

  const handleToggleMoveTilePermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !moveTilePermission;
      setMoveTilePermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { moveTile: updatedPermission });
    }
  };

  const handleToggleAddRemoveTilePermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !addRemoveTilePermission;
      setAddRemoveTilePermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { addRemoveTile: updatedPermission });
    }
  };

  const handleAssignCardPermission = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.changePermissions) {
        console.log("You do not have permission to change permissions.");
        notify("You do not have permission to change permissions.", "error");
        return;
      }
    }
    if (selectedRole) {
      const updatedPermission = !assignCardPermission;
      setAssignCardPermission(updatedPermission);
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { assignCard: updatedPermission });
    }
  };



  const handleRemoveRole = async (role: Role) => {
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveRole) {
        console.log("You do not have permission to remove roles.");
        notify("You do not have permission to remove roles.", "error");
        return;
      }
    }
    const roleRef = doc(
      db,
      "users",
      ownerUsername,
      "workspaces",
      workspaceId,
      "roles",
      role.name
    );

    await deleteDoc(roleRef);

    // If the deleted role was the selected one, deselect it
    if (selectedRole?.name === role.name) {
      setSelectedRole(null);
    }
  };

  return (
    <div>
      <i
        className="fas fa-cog cursor-pointer mt-0.5 p-2 rounded-xl text-xl hover:bg-gray-100"
        onClick={handleOpenSettings}
      ></i>

      {isSettingsOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={handleCloseSettings}
        >
          <div
            className="bg-white rounded-2xl p-2 shadow-lg flex flex-col w-3/6 h-3/6 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start rounded-lg ">
              <div className="flex p-3 justify-between space-x-4">
                <button
                  className={`${
                    activeTab === "Roles"
                      ? "bg-sky-500 p-2 rounded-xl text-white font-bold"
                      : "p-2 rounded-xl hover:bg-sky-300 font-bold"
                  }`}
                  onClick={() => setActiveTab("Roles")}
                >
                  Roles
                </button>
                <button
                  className={`${
                    activeTab === "Members"
                      ? "bg-sky-500 p-2 rounded-xl text-white font-bold"
                      : "p-2 rounded-xl hover:bg-sky-300 font-bold"
                  }`}
                  onClick={() => setActiveTab("Members")}
                >
                  Members
                </button>
              </div>
              <button
                className="p-2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-100"
                onClick={handleCloseSettings}
              >
                ✖
              </button>
            </div>
            {activeTab === "Roles" && (
              <div className="flex p-3">
                <div className="w-1/2 pr-5">
                  <h2 className="text-lg font-bold text-center bg-sky-300 p-2 rounded-xl mb-2">
                    Create New Role
                  </h2>
                  <input
                    type="text"
                    className="mt-2 resize-none rounded-xl p-2 w-full border border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <button
                    className="p-2 mt-2 mb-5 bg-sky-500 text-white rounded-xl"
                    onClick={handleCreateRole}
                  >
                    Create Role
                  </button>
                  <h2 className="text-lg font-bold text-center p-2 rounded-xl mb-2 bg-sky-300">
                    Select Role
                  </h2>
                  {roles.map((role) => (
                    <div
                      key={role.name}
                      className={`cursor-pointer p-2 rounded-xl flex justify-between items-center ${
                        selectedRole?.name === role.name
                          ? "bg-sky-500  text-white"
                          : "hover:bg-sky-300"
                      } `}
                      onClick={() => handleSelectRole(role)}
                    >
                      <span>{role.name}</span>
                      <button
                        className="p-2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the click event from bubbling up to the parent div
                          handleRemoveRole(role);
                        }}
                      >
                        <i className="fas fa-trash text-gray-500"></i>
                      </button>
                    </div>
                  ))}
                </div>
                {selectedRole && (
                  <div className="w-1/2 flex flex-col pl-5">
                    <h2 className="text-xl font-bold text-center mb-2 bg-sky-300 p-2 rounded-xl">
                      Permissions
                    </h2>
                    <div className="flex flex-col items-stretch space-y-2">
                      <h2 className="text-lg font-bold text-start">
                        Member Settings
                      </h2>
                      <div className="flex items-center justify-between space-x-2">
                        <span>Add/Remove Role</span>
                        <Switch
                          onChange={handleToggleAddRemoveRolePermission}
                          checked={addRemoveRolePermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <span>Change permissions</span>
                        <Switch
                          onChange={handleToggleChangePermissionsPermission}
                          checked={changePermissionsPermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                      <h2 className="text-lg font-bold text-start">Cards</h2>
                      <div className="flex  items-center justify-between space-x-2">
                        <span>Move Card</span>
                        <Switch
                          onChange={handleToggleMoveCardPermission}
                          checked={moveCardPermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <span>Add/Remove Card</span>
                        <Switch
                          onChange={handleToggleAddRemoveCardPermission}
                          checked={addRemoveCardPermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                      <div className="flex  items-center justify-between space-x-2">
                        <span>Assign Cards</span>
                        <Switch
                          onChange={handleAssignCardPermission}
                          checked={assignCardPermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                      <h2 className="text-lg font-bold text-start">Tiles</h2>

                      <div className="flex items-center justify-between space-x-2">
                        <span>Move tile</span>
                        <Switch
                          onChange={handleToggleMoveTilePermission}
                          checked={moveTilePermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <span>Add/Remove tile</span>
                        <Switch
                          onChange={handleToggleAddRemoveTilePermission}
                          checked={addRemoveTilePermission}
                          offColor="#767577"
                          onColor="#81b0ff"
                          height={20}
                          width={48}
                          handleDiameter={16}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "Members" && (
              <div className="flex p-3">
                <div className="w-1/2 pr-5">
                  <h2 className="text-lg font-bold text-center mb-2 p-2 bg-sky-300 rounded-xl">
                    Select Member
                  </h2>
                  {members.map((member) => (
                    <div
                      key={member.username}
                      className={`cursor-pointer p-2 rounded-xl ${
                        selectedMember?.username === member.username
                          ? "bg-sky-500  text-white"
                          : "hover:bg-sky-300"
                      } `}
                      onClick={() => handleSelectMember(member)}
                    >
                      {member.username}
                    </div>
                  ))}
                </div>
                {selectedMember && (
                  <div className="w-1/2 pl-5">
                    <h2 className="text-lg font-bold text-center mb-2 p-2 bg-sky-300 rounded-xl">
                      Assign Role
                    </h2>
                    {roles.map((role) => (
                      <div
                        key={role.name}
                        className={`cursor-pointer p-2 rounded-xl ${
                          selectedMember?.role === role.name
                            ? "bg-sky-500  text-white"
                            : "hover:bg-sky-300"
                        } `}
                        onClick={() => handleAssignRole(role)}
                      >
                        {role.name}
                        {selectedMember?.role === role.name && (
                          <span className="ml-2">
                            <i className="fas fa-check"></i>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
