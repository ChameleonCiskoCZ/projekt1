import { useContext, useState } from "react";
import { Tile } from "../../page";
import { Role } from "../../page";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { useAuth } from "@/app/_hooks/useAuth";

export const useRemoveCard = (
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>,
  userRole: Role | null
) => {
  const [removedCardIds, setRemovedCardIds] = useState<{
    [tileId: string]: string[];
  }>({});

  const { notify } = useContext(NotificationContext);
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const username = useAuth();

  const handleRemoveCard = (tileId: string, cardId: string) => {
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveCard) {
        console.log("You do not have permission to remove cards.");
        notify("You do not have permission to remove cards.", "error");
        return;
      }
    }
      setTiles((prevTiles) =>
        prevTiles.map((tile) =>
          tile.id === tileId
            ? {
                ...tile,
                cards: tile.cards.filter((card) => card.id !== cardId),
              }
            : tile
        )
      );
      setRemovedCardIds((prevRemovedCardIds) => {
        const newRemovedCardIds = { ...prevRemovedCardIds };
        if (newRemovedCardIds[tileId]) {
          newRemovedCardIds[tileId].push(cardId);
        } else {
          newRemovedCardIds[tileId] = [cardId];
        }
        return newRemovedCardIds;
      });
    
  }
    return { removedCardIds, setRemovedCardIds, handleRemoveCard };
};