import { useContext, useState } from "react";
import { Role, Tile } from "../page";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { useAuth } from "@/app/_hooks/useAuth";

interface MovedCards {
  [key: string]: string;
}

export const useHandleDrag = (
  tiles: Tile[],
  setTiles: (tiles: Tile[]) => void,
  userRole: Role | null
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [movedCards, setMovedCards] = useState<MovedCards>({});
  const { notify } = useContext(NotificationContext);
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const username = useAuth();

  const handleTileDrag = (sourceIndex: number, destinationIndex: number) => {
    if (username !== ownerUsername && !userRole?.moveTile) {
      notify("You do not have permission to move tiles.", "error");
      return;
    }

    const newTiles = Array.from(tiles);
    const [removed] = newTiles.splice(sourceIndex, 1);
    newTiles.splice(destinationIndex, 0, removed);

    // Update the position of each tile
    newTiles.forEach((tile, index) => {
      tile.position = index;
    });

    setTiles(newTiles);
  };

  const handleCardDrag = (
    source: { droppableId: string; index: number },
    destination: { droppableId: string; index: number }
  ) => {
    if (username !== ownerUsername && !userRole?.moveCard) {
      notify("You do not have permission to move cards.", "error");
      return;
    }

    const startTileId = source.droppableId.split("-")[1];
    const endTileId = destination.droppableId.split("-")[1];

    const startTile = tiles.find((tile) => tile.id === startTileId);
    const endTile = tiles.find((tile) => tile.id === endTileId);

    if (!startTile || !endTile) {
      console.log("Tile not found");
      return;
    }

    const startCards = Array.from(startTile.cards);
    const [removed] = startCards.splice(source.index, 1);

    if (startTileId === endTileId) {
      startCards.splice(destination.index, 0, removed);
      startCards.forEach((card, index) => {
        card.position = index;
      });
      startTile.cards = startCards;
    } else {
      const endCards = Array.from(endTile.cards);
      endCards.splice(destination.index, 0, removed);
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
  };

  const handleDragEnd = (result: any) => {
    setIsDragging(true);
    const { source, destination, type } = result;

    if (!destination) {
      setIsDragging(false);
      return;
    }

    if (type === "tile") {
      handleTileDrag(source.index, destination.index);
    } else {
      handleCardDrag(source, destination);
    }

    setIsDragging(false);
  };

  return { handleDragEnd, isDragging, movedCards };
};
