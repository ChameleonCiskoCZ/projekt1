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

const Settings: React.FC<UserInfo> = ({
  ownerUsername,
  workspaceId,
  userRole,
  members,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Roles");
  const [newRoleName, setNewRoleName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [permissions, setPermissions] = useState({
    moveCard: false,
    addRemoveCard: false,
    addRemoveRole: false,
    changePermissions: false,
    moveTile: false,
    addRemoveTile: false,
    assignCard: false,
  });
  const db = getFirestore(firebase_app);
  const username = useAuth();
  const { notify } = useContext(NotificationContext);
  const [isCreateRoleVisible, setIsCreateRoleVisible] = useState(false);
  const [isBoardSectionVisible, setIsBoardSectionVisible] = useState(false);

  useEffect(() => {
    if (db && ownerUsername && workspaceId) {
      const rolesCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles"
      );
      const unsubscribe = onSnapshot(rolesCollection, (snapshot) => {
        setRoles(snapshot.docs.map((doc) => doc.data() as Role));
      });

      return () => unsubscribe();
    }
  }, [db, ownerUsername, workspaceId]);

  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setSelectedRole(null);
    setSelectedMember(null);
  };

  const handleSelectMember = (member: Member) => setSelectedMember(member);

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
      setSelectedMember((prevState) =>
        prevState ? { ...prevState, role: role.name } : null
      );
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      notify("Role name cannot be empty.", "error");
      return;
    }
    if (username !== ownerUsername && !userRole?.addRemoveRole) {
      notify("You do not have permission to create roles.", "error");
      return;
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
      notify("Role already exists", "error");
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

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setPermissions({
      moveCard: role.moveCard,
      addRemoveCard: role.addRemoveCard,
      addRemoveRole: role.addRemoveRole,
      changePermissions: role.changePermissions,
      moveTile: role.moveTile,
      addRemoveTile: role.addRemoveTile,
      assignCard: role.assignCard,
    });
  };

  const handleTogglePermission = async (
    permission: keyof typeof permissions
  ) => {
    if (username !== ownerUsername && !userRole?.changePermissions) {
      notify("You do not have permission to change permissions.", "error");
      return;
    }
    if (selectedRole) {
      const updatedPermission = !permissions[permission];
      setPermissions((prev) => ({ ...prev, [permission]: updatedPermission }));
      const roleRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "roles",
        selectedRole.name
      );
      await updateDoc(roleRef, { [permission]: updatedPermission });
    }
  };

  const handleRemoveRole = async (role: Role) => {
    if (username !== ownerUsername && !userRole?.addRemoveRole) {
      notify("You do not have permission to remove roles.", "error");
      return;
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
    if (selectedRole?.name === role.name) {
      setSelectedRole(null);
    }
  };

  return (
    <div>
      <i
        className="fas fa-cog cursor-pointer mt-0.5 p-2 rounded-xl text-xl hover:bg-sky-100"
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
                      ? "bg-sky-200 p-2 rounded-xl font-bold"
                      : "p-2 rounded-xl hover:bg-sky-100 font-bold"
                  }`}
                  onClick={() => setActiveTab("Roles")}
                >
                  Roles
                </button>
                <button
                  className={`${
                    activeTab === "Members"
                      ? "bg-sky-200 p-2 rounded-xl font-bold"
                      : "p-2 rounded-xl hover:bg-sky-100 font-bold"
                  }`}
                  onClick={() => setActiveTab("Members")}
                >
                  Members
                </button>
              </div>
              <button
                className="fas fa-xmark py-1 px-1.5 text-2xl flex items-center justify-center rounded-xl hover:bg-sky-100"
                onClick={handleCloseSettings}
              ></button>
            </div>
            {activeTab === "Roles" && (
              <div className="flex p-3">
                <div className="w-1/2 mr-5 border p-2 rounded-2xl">
                  <h2 className="text-lg font-bold text-center p-2 bg-sky-300 rounded-xl mb-2 ">
                    Select Role
                  </h2>
                  {roles.map((role) => (
                    <div
                      key={role.name}
                      className={`cursor-pointer p-2 rounded-xl flex justify-between items-center ${
                        selectedRole?.name === role.name
                          ? "bg-sky-200  "
                          : "hover:bg-sky-100"
                      } `}
                      onClick={() => handleSelectRole(role)}
                    >
                      <span>{role.name}</span>
                      <button
                        className="p-2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-sky-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRole(role);
                        }}
                      >
                        <i className="fas fa-trash text-gray-500"></i>
                      </button>
                    </div>
                  ))}
                  <div>
                    {isCreateRoleVisible ? (
                      <div className="flex flex-col ">
                        <input
                          type="text"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              handleCreateRole();
                            }
                          }}
                          autoFocus
                          className="mt-2 border rounded-xl p-2"
                        />
                        <button
                          onClick={handleCreateRole}
                          className="mt-2 bg-blue-500 text-white rounded-xl p-2 hover:bg-blue-600"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCreateRoleVisible(true)}
                        className="w-full mt-2 rounded-xl p-2 bg-sky-100 hover:bg-sky-200 "
                      >
                        <span className="text-2xl">+</span>
                      </button>
                    )}
                  </div>
                </div>
                {selectedRole && (
                  <div className="w-1/2 flex flex-col p-2 border rounded-2xl">
                    <h2 className="text-xl font-bold text-center bg-sky-300 mb-2 p-2 rounded-xl">
                      Permissions
                    </h2>
                    <button
                      className={`w-full p-2 text-start text-lg font-bold rounded-xl mb-2 ${
                        isBoardSectionVisible
                          ? "bg-sky-200"
                          : "hover:bg-sky-100"
                      }`}
                      onClick={() =>
                        setIsBoardSectionVisible(!isBoardSectionVisible)
                      }
                    >
                      Board
                    </button>
                    {isBoardSectionVisible && (
                      <div className="flex flex-col items-stretch px-2 space-y-2">
                        <h2 className="text-lg font-semibold text-start">
                          Member Settings
                        </h2>
                        {[
                          {
                            label: "Add/Remove Role",
                            permission: "addRemoveRole",
                          },
                          {
                            label: "Change permissions",
                            permission: "changePermissions",
                          },
                        ].map(({ label, permission }) => (
                          <div
                            key={permission}
                            className="flex items-center justify-between space-x-2"
                          >
                            <span>{label}</span>
                            <Switch
                              onChange={() =>
                                handleTogglePermission(
                                  permission as keyof typeof permissions
                                )
                              }
                              checked={
                                permissions[
                                  permission as keyof typeof permissions
                                ]
                              }
                              offColor="#767577"
                              onColor="#81b0ff"
                              height={20}
                              width={48}
                              handleDiameter={16}
                            />
                          </div>
                        ))}
                        <h2 className="text-lg font-bold text-start">Cards</h2>
                        {[
                          { label: "Move Card", permission: "moveCard" },
                          {
                            label: "Add/Remove Card",
                            permission: "addRemoveCard",
                          },
                          { label: "Assign Cards", permission: "assignCard" },
                        ].map(({ label, permission }) => (
                          <div
                            key={permission}
                            className="flex items-center justify-between space-x-2"
                          >
                            <span>{label}</span>
                            <Switch
                              onChange={() =>
                                handleTogglePermission(
                                  permission as keyof typeof permissions
                                )
                              }
                              checked={
                                permissions[
                                  permission as keyof typeof permissions
                                ]
                              }
                              offColor="#767577"
                              onColor="#81b0ff"
                              height={20}
                              width={48}
                              handleDiameter={16}
                            />
                          </div>
                        ))}
                        <h2 className="text-lg font-bold text-start">Tiles</h2>
                        {[
                          { label: "Move tile", permission: "moveTile" },
                          {
                            label: "Add/Remove tile",
                            permission: "addRemoveTile",
                          },
                        ].map(({ label, permission }) => (
                          <div
                            key={permission}
                            className="flex items-center justify-between space-x-2"
                          >
                            <span>{label}</span>
                            <Switch
                              onChange={() =>
                                handleTogglePermission(
                                  permission as keyof typeof permissions
                                )
                              }
                              checked={
                                permissions[
                                  permission as keyof typeof permissions
                                ]
                              }
                              offColor="#767577"
                              onColor="#81b0ff"
                              height={20}
                              width={48}
                              handleDiameter={16}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab === "Members" && (
              <div className="flex p-3">
                <div className="w-1/2 p-2 border rounded-2xl mr-5">
                  <h2 className="text-lg font-bold text-center mb-2 p-2 bg-sky-300 rounded-xl">
                    Select Member
                  </h2>
                  {members.map((member) => (
                    <div
                      key={member.username}
                      className={`cursor-pointer p-2 rounded-xl ${
                        selectedMember?.username === member.username
                          ? "bg-sky-200  "
                          : "hover:bg-sky-100"
                      } `}
                      onClick={() => handleSelectMember(member)}
                    >
                      {member.username}
                    </div>
                  ))}
                </div>
                {selectedMember && (
                  <div className="w-1/2 p-2 border rounded-2xl">
                    <h2 className="text-lg font-bold text-center mb-2 p-2 bg-sky-300 rounded-xl">
                      Assign Role
                    </h2>
                    {roles.map((role) => (
                      <div
                        key={role.name}
                        className={`cursor-pointer p-2 rounded-xl ${
                          selectedMember?.role === role.name
                            ? "bg-sky-200  "
                            : "hover:bg-sky-100"
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
