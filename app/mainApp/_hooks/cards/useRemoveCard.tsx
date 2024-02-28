import { useState } from "react";
import { Tile } from "../../page";

export const useRemoveCard = (setTiles: React.Dispatch<React.SetStateAction<Tile[]>>) => {

    const [removedCardIds, setRemovedCardIds] = useState<{
      [tileId: string]: string[];
    }>({});

    const handleRemoveCard = (tileId: string, cardId: string) => {
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
    };
  return { removedCardIds,setRemovedCardIds, handleRemoveCard };
};