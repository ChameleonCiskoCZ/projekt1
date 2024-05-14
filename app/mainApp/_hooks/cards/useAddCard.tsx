import { useState, useRef, useEffect, useContext } from "react";
import { Role, Tile } from "../../page"; // adjust the path according to your directory structure
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { useAuth } from "@/app/_hooks/useAuth";

export const useAddCard = (
  tiles: Tile[],
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>,
  userRole: Role | null,
) => {
  const [expandedTileId, setExpandedTileId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const addCardRef = useRef<HTMLDivElement>(null);
  const { notify } = useContext(NotificationContext);
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const username = useAuth();

  const handleAddCardClick = (tileId: string) => {
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveCard) {
        console.log("You do not have permission to add cards.");
        notify("You do not have permission to add cards.", "error");
        return;
      }
    }
    setExpandedTileId(tileId);
  };

  // Add a new card to a tile
  const handleAddCard = (tileId: string) => {
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveCard) {
        console.log("You do not have permission to add cards.");
        notify("You do not have permission to add cards.", "error");
        return;
      }
    }
    // Find the tile to which the card will be added
    const tile = tiles.find((tile) => tile.id === tileId);
    // Determine the position for the new card
    const newPosition = tile ? tile.cards.length : 0;

    if (newCardName.trim() !== "") {
      // Create a new card
      const newCard = {
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        name: newCardName,
        position: newPosition,
        description: "",
        assignedTo: [],
      };

      // Add the card to the tile
      setTiles((prevTiles) =>
        prevTiles.map((tile) =>
          tile.id === tileId
            ? { ...tile, cards: [...tile.cards, newCard] }
            : tile
        )
      );

      // Reset the state
      setNewCardName("");
      setExpandedTileId(null);
    }
  };

  // handle clicking outside addcard button
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        addCardRef.current &&
        !addCardRef.current.contains(event.target as Node)
      ) {
        setExpandedTileId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addCardRef]);

  return {
    newCardName,
    setNewCardName,
    addCardRef,
    expandedTileId,
    handleAddCardClick,
    handleAddCard,
  };
};
