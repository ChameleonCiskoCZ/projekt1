import { Card, Member, Role, Tile } from "../../page";
import { useModal } from "../../_hooks/cards/useCardModal";
import { Cards } from "./cards";
import { useContext, useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase";
import { useAuth } from "@/app/_hooks/useAuth";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { set } from "firebase/database";

interface CardModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCard: Card | null;
  setSelectedCard: React.Dispatch<React.SetStateAction<Card | null>>;
  selectedTile: Tile | null;
  tiles: Tile[];
  handleRemoveCard: (tileId: string, cardId: string) => void;
  workspaceId: string;
  members: Member[];
  userRole: Role | null;
}


export const CardModal: React.FC<CardModalProps> = ({
  tiles,
  handleRemoveCard,
  isModalOpen,
  setIsModalOpen,
  selectedCard,
  setSelectedCard,
  selectedTile,
  workspaceId,
  members,
  userRole,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const db = getFirestore(firebase_app);
  const [isAssigning, setIsAssigning] = useState(false);
  const username = useAuth();
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const { notify } = useContext(NotificationContext);


  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleAssignCard = async (memberUsername: string) => {
    if (username !== ownerUsername) {
      if (!userRole?.assignCard) {
        console.log("You do not have permission to assign cards.");
        notify("You do not have permission to assign cards.", "error");
        return;
      }
    }
    if (!selectedCard || !selectedTile || !ownerUsername) {
      return;
    }

    let updatedAssignedTo;
    if (selectedCard.assignedTo?.includes(memberUsername)) {
      updatedAssignedTo = selectedCard.assignedTo.filter(
        (username) => username !== memberUsername
      );
      setSelectedMembers(selectedMembers.filter((m) => m !== memberUsername));
    } else {
      updatedAssignedTo = [...(selectedCard.assignedTo || []), memberUsername];
      setSelectedMembers([...selectedMembers, memberUsername]);
    }

    // Find the tile and card in the tiles array
    const tile = tiles.find((tile) => tile.id === selectedTile.id);
    const card = tile?.cards.find((card) => card.id === selectedCard.id);

    if (card) {
      // Update the card directly
      card.assignedTo = updatedAssignedTo;
    }
/*
    const cardRef = doc(
      db,
      "users",
      ownerUsername,
      "workspaces",
      workspaceId,
      "tiles",
      selectedTile.id,
      "cards",
      selectedCard.id
    );

    await updateDoc(cardRef, {
      assignedTo: updatedAssignedTo,
    });*/
  };

  const { descriptionRef, nameRef } = useModal(selectedCard, isModalOpen);
  return (
    <div>
      {isModalOpen && selectedCard && selectedTile && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={() => {
            setIsModalOpen(false);
            setIsAssigning(false);
          }}
        >
          <div
            className="bg-white  rounded-2xl p-2 shadow flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between space-x-40 items-center font-bold text-lg mb-2">
              <textarea
                ref={nameRef}
                className="flex-grow resize-none p-0.5 pl-2 ml-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCard.name}
                onChange={(e) => {
                  setSelectedCard({ ...selectedCard, name: e.target.value });
                  // Find the card in the tiles state and update its name
                  tiles.forEach((tile) => {
                    tile.cards.forEach((card) => {
                      if (card.id === selectedCard.id) {
                        card.name = e.target.value;
                      }
                    });
                  });
                }}
              />
              <button
                className="m-1 p-4 ml-4 w-6 h-6 flex items-center justify-center rounded-xl hover:bg-red-100"
                onClick={() => setIsModalOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="flex justify-between space-x-16 items-start">
              <div className="p-2">
                <label className="text-lg pl-1 font-bold">Description</label>
                <textarea
                  ref={descriptionRef}
                  className="mt-2 resize-none rounded-xl p-2 w-full overflow-hidden h-20 border border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" // Added "resize-none" to prevent resizing
                  value={selectedCard.description || ""}
                  onChange={(e) => {
                    setSelectedCard({
                      ...selectedCard,
                      description: e.target.value,
                    });
                    // Find the card in the tiles state and update its description
                    tiles.forEach((tile) => {
                      tile.cards.forEach((card) => {
                        if (card.id === selectedCard.id) {
                          card.description = e.target.value;
                        }
                      });
                    });
                  }}
                />
              </div>
              <div className="flex flex-col mt-10">
                <button
                  className="m-1 p-2 bg-red-300 hover:bg-red-500 text-white rounded-xl"
                  onClick={() => {
                    // Add your remove logic here
                    handleRemoveCard(selectedTile.id, selectedCard.id);
                    setIsModalOpen(false);
                  }}
                >
                  Remove Card
                </button>
                <button
                  className="m-1 p-2 bg-blue-300 hover:bg-blue-500 text-white rounded-xl"
                  onClick={() => {
                    setIsAssigning(!isAssigning);
                  }}
                >
                  Assign Card
                </button>
                {isAssigning && (
                  <div
                    className="relative inline-block text-left"
                    ref={dropdownRef}
                  >
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        {members.map((member) => (
                          <div
                            key={member.username}
                            className={`cursor-pointer p-2 rounded-xl m-1 ${
                              selectedCard.assignedTo?.includes(member.username)
                                ? "bg-blue-500 text-white"
                                : "hover:bg-blue-300"
                            }`}
                            onClick={() => handleAssignCard(member.username)}
                          >
                            {member.username}
                            {selectedCard.assignedTo?.includes(
                              member.username
                            ) && (
                              <span className="ml-2">
                                <i className="fas fa-check"></i>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
