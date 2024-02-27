import { useState, useRef, useEffect } from "react";
import { Tile } from "../page"; // adjust the path according to your directory structure

export const useAddCard = (
  tiles: Tile[],
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
) => {
  const [expandedTileId, setExpandedTileId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const addCardRef = useRef<HTMLDivElement>(null);

  const handleAddCardClick = (tileId: string) => {
    setExpandedTileId(tileId);
  };

  // Add a new card to a tile
  const handleAddCard = (tileId: string) => {
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
