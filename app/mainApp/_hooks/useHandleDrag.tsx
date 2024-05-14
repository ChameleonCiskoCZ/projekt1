import { useContext, useState } from "react";
import { Role, Tile } from "../page";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { useAuth } from "@/app/_hooks/useAuth";

export const useHandleDrag = (
  tiles: Tile[],
  setTiles: (tiles: Tile[]) => void,
  userRole: Role | null
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [movedCards, setMovedCards] = useState<{ [key: string]: string }>({});
  const { notify } = useContext(NotificationContext);
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const username = useAuth();

  const handleDragEnd = (result: any) => {
    setIsDragging(true);
    const { source, destination, type } = result;

    // Ignore drops outside of a droppable area
    if (!destination) {
      setIsDragging(false);
      return;
    }

    if (type === "tile") {
      if (username !== ownerUsername) {
        if (!userRole?.moveTile) {
          console.log("You do not have permission to move tiles.");
          notify("You do not have permission to move tiles.", "error");
          setIsDragging(false);
          return;
        }
      }
      // Handle tile reordering
      const newTiles = Array.from(tiles);
      const [removed] = newTiles.splice(source.index, 1);
      newTiles.splice(destination.index, 0, removed);

      // Update the position of each tile
      newTiles.forEach((tile, index) => {
        tile.position = index;
      });

      setTiles(newTiles);
    } else {
      if (username !== ownerUsername) {
        if (!userRole?.moveCard) {
          console.log("You do not have permission to move cards.");
          notify("You do not have permission to move cards.", "error");
          setIsDragging(false);
          return;
        }
      }
      // Handle card reordering
      const startTileId = source.droppableId.split("-")[1];
      const endTileId = destination.droppableId.split("-")[1];

      const startTile = tiles.find((tile) => tile.id === startTileId);
      const endTile = tiles.find((tile) => tile.id === endTileId);

      // Check if startTile and endTile are not undefined
      if (!startTile || !endTile) {
        throw new Error("Tile not found");
      }

      // Moving within the same tile
      if (startTileId === endTileId) {
        const newCards = Array.from(startTile.cards);
        const [removed] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, removed);

        // Update the position of each card
        newCards.forEach((card, index) => {
          card.position = index;
        });

        startTile.cards = newCards;
      } else {
        // Moving to a different tile
        const startCards = Array.from(startTile.cards);
        const [removed] = startCards.splice(source.index, 1);
        const endCards = Array.from(endTile.cards);
        endCards.splice(destination.index, 0, removed);

        // Update the position of each card in the start and end tiles
        startCards.forEach((card, index) => {
          card.position = index;
        });
        endCards.forEach((card, index) => {
          card.position = index;
        });

        startTile.cards = startCards;
        endTile.cards = endCards;

        setMovedCards((prevMovedCards) => ({
          ...prevMovedCards,
          [removed.id]: startTileId,
        }));
      }

      setTiles([...tiles]);
    }
    setIsDragging(false);
  };

  return { handleDragEnd, isDragging, movedCards };
};
