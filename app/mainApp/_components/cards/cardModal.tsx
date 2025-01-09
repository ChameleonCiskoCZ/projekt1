import { Card, Member, Role, Tile } from "../../page";
import { useModal } from "../../_hooks/cards/useCardModal";
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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
  ownerUsername: string;
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
  ownerUsername,
  members,
  userRole,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editedTime, setEditedTime] = useState(selectedCard?.elapsedTime || 0);
  const [editedHours, setEditedHours] = useState(0);
  const [editedMinutes, setEditedMinutes] = useState(0);
  const [editedSeconds, setEditedSeconds] = useState(0);
  const [images, setImages] = useState<string[]>(selectedCard?.images || []);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const username = useAuth();
  const { notify } = useContext(NotificationContext);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const trackingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notificationIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  const { descriptionRef, nameRef } = useModal(selectedCard, isModalOpen);

  // Handle click outside to close the dropdown
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedCard) {
      setImages(selectedCard.images || []);
    }
  }, [selectedCard]);

  // Handle assigning members to the card
  const handleAssignCard = async (memberUsername: string) => {
    if (username !== ownerUsername && !userRole?.assignCard) {
      notify("You do not have permission to assign cards.", "error");
      return;
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

    setSelectedCard({ ...selectedCard, assignedTo: updatedAssignedTo });
  };

  // Handle tracking work time for the card
  const handleTrackButtonClick = (cardId: string) => {
    const currentIntervals = trackingIntervalsRef.current;
    const notificationIntervals = notificationIntervalsRef.current;

    if (currentIntervals.has(cardId)) {
      // Stop tracking
      clearInterval(currentIntervals.get(cardId));
      clearInterval(notificationIntervals.get(cardId));
      currentIntervals.delete(cardId);
      notificationIntervals.delete(cardId);
    } else {
      // Start tracking
      const timer = setInterval(() => {
        setSelectedCard((prevCard) => {
          if (prevCard && prevCard.id === cardId) {
            const updatedCard = {
              ...prevCard,
              elapsedTime: (prevCard.elapsedTime || 0) + 1,
            };

            // Update the card in tiles array
            tiles.forEach((tile) => {
              tile.cards.forEach((card) => {
                if (card.id === updatedCard.id) {
                  card.elapsedTime = updatedCard.elapsedTime;
                }
              });
            });

            return updatedCard;
          }
          return prevCard;
        });
      }, 1000);

      const notificationTimer = setInterval(() => {
        notify(
          `Timer for card ${selectedCard?.name} is still running.`,
          "info"
        );
      }, 5 * 60 * 1000); // Notify every 5 minutes

      currentIntervals.set(cardId, timer);
      notificationIntervals.set(cardId, notificationTimer);
    }
  };

  // Format time for display
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  // Handle timer click to edit time
  const handleTimerClick = () => {
    const elapsedTime = selectedCard?.elapsedTime || 0;
    setEditedTime(elapsedTime);

    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    setEditedHours(hours);
    setEditedMinutes(minutes);
    setEditedSeconds(seconds);

    setShowEditPopup(true);
  };

  // Handle edit time change
  const handleEditTimeChange = (
    e: ChangeEvent<HTMLInputElement>,
    unit: string
  ) => {
    const value = parseInt(e.target.value, 10);
    if (unit === "hours") {
      setEditedHours(value);
    } else if (unit === "minutes") {
      setEditedMinutes(value);
    } else if (unit === "seconds") {
      setEditedSeconds(value);
    }
  };

  // Save edited time
  const handleSaveTime = () => {
    const totalSeconds =
      editedHours * 3600 + editedMinutes * 60 + editedSeconds;
    if (selectedCard) {
      selectedCard.elapsedTime = totalSeconds;
    }
    setShowEditPopup(false);
  };

  // Handle image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (images.length >= 9) {
        notify("You can only upload up to 9 images.", "error");
        return;
      }

      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "jafaktnevimkamo"); // Replace with your Cloudinary upload preset

      try {
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dsrfukgtq/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        const newImageUrl = data.secure_url;

        setImages((prevImages) => [...prevImages, newImageUrl]);
        if (selectedCard) {
          const updatedCard = {
            ...selectedCard,
            images: [...(selectedCard.images || []), newImageUrl],
          };
          setSelectedCard(updatedCard);

          // Update the card in the tiles state
          tiles.forEach((tile) => {
            tile.cards.forEach((card) => {
              if (card.id === selectedCard.id) {
                card.images = updatedCard.images;
              }
            });
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        notify("Error uploading image. Please try again.", "error");
      }
    }
  };

  // Handle image removal
  const handleRemoveImage = (imageUrl: string) => {
    const updatedImages = images.filter((image) => image !== imageUrl);
    setImages(updatedImages);
    if (selectedCard) {
      const updatedCard = {
        ...selectedCard,
        images: updatedImages,
      };
      setSelectedCard(updatedCard);

      // Update the card in the tiles state
      tiles.forEach((tile) => {
        tile.cards.forEach((card) => {
          if (card.id === selectedCard.id) {
            card.images = updatedCard.images;
          }
        });
      });
    }
  };

  // Handle image click to enlarge
  const handleImageClick = (image: string) => {
    setEnlargedImage(image);
  };

  // Handle close enlarged image
  const handleCloseEnlargedImage = () => {
    setEnlargedImage(null);
  };

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
            className="bg-white rounded-2xl p-2 shadow flex flex-col"
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
                className="fas fa-xmark m-1 py-1 px-1.5 ml-4 flex text-2xl items-center justify-center rounded-xl hover:bg-sky-100"
                onClick={() => setIsModalOpen(false)}
              ></button>
            </div>
            <div className="flex justify-between space-x-16 items-start">
              <div className="p-2">
                <label className="text-lg pl-1 font-bold">Description</label>
                <textarea
                  ref={descriptionRef}
                  className="mt-2 resize-none rounded-xl p-2 w-full overflow-hidden h-20 border border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="mt-4">
                  <label className="text-lg pl-1 font-bold flex items-center">
                    Images
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="fileInput"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer ml-2">
                      <i className="fas fa-paperclip text-xl"></i>
                    </label>
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {images.slice(0, 9).map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Uploaded ${index}`}
                          className="w-32 h-32 object-cover cursor-pointer rounded-lg"
                          onClick={() => handleImageClick(image)}
                        />
                        <button
                          className="absolute top-0 right-0 m-1 p-1 text-gray-400 rounded-full"
                          onClick={() => handleRemoveImage(image)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col mt-10">
                <button
                  className="m-1 p-2 bg-red-300 hover:bg-red-500 text-white rounded-xl"
                  onClick={() => {
                    handleRemoveCard(selectedTile.id, selectedCard.id);
                    setIsModalOpen(false);
                  }}
                >
                  Remove Card
                </button>
                <button
                  className={`mt-1 mx-1 mb-0.5 p-2 rounded-t-xl rounded-b-sm text-white ${
                    trackingIntervalsRef.current.has(selectedCard?.id ?? "")
                      ? "bg-green-500 hover:bg-green-300"
                      : "bg-green-300 hover:bg-green-500"
                  }`}
                  onClick={() => handleTrackButtonClick(selectedCard?.id ?? "")}
                >
                  {trackingIntervalsRef.current.has(selectedCard?.id ?? "")
                    ? "Stop Tracking"
                    : "Track Work Time"}
                </button>
                <div
                  className="mb-1 mx-1 p-2 bg-gray-200 text-black rounded-b-xl rounded-t-sm cursor-pointer"
                  onClick={handleTimerClick}
                >
                  {formatTime(selectedCard.elapsedTime || 0)}
                </div>
                {showEditPopup && (
                  <div
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
                    onClick={() => setShowEditPopup(false)}
                  >
                    <div
                      className="bg-white rounded-2xl p-2 shadow flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center font-bold text-lg mb-2">
                        <h2 className="text-xl font-bold p-2">Edit Time</h2>
                        <button
                          className="fas fa-xmark py-1 mr-1 px-1.5 text-xl flex items-center justify-center rounded-xl hover:bg-sky-100"
                          onClick={() => setShowEditPopup(false)}
                        ></button>
                      </div>
                      <div className="flex space-x-2 mb-4 px-2 items-center">
                        <input
                          type="number"
                          value={editedHours}
                          onChange={(e) => handleEditTimeChange(e, "hours")}
                          className="border p-2 rounded-xl w-16 text-center"
                          placeholder="Hours"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          value={editedMinutes}
                          onChange={(e) => handleEditTimeChange(e, "minutes")}
                          className="border p-2 rounded-xl w-16 text-center"
                          placeholder="Minutes"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          value={editedSeconds}
                          onChange={(e) => handleEditTimeChange(e, "seconds")}
                          className="border p-2 rounded-xl w-16 text-center"
                          placeholder="Seconds"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          className="m-1 p-2 bg-blue-500 hover:bg-blue-700 text-white rounded-xl"
                          onClick={handleSaveTime}
                        >
                          Save
                        </button>
                        <button
                          className="m-1 p-2 bg-red-500 hover:bg-red-700 text-white rounded-xl"
                          onClick={() => setShowEditPopup(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
      {enlargedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75"
          onClick={handleCloseEnlargedImage}
        >
          <img
            src={enlargedImage}
            alt="Enlarged"
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  );
};
