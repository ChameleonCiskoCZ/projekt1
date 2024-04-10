import { useState } from "react";
import { Tile } from "../page"; // adjust the path according to your directory structure
import { writeBatch, collection, doc, getDoc } from "firebase/firestore"; // adjust the path according to your directory structure

export const useSave = (
  ownerUsername: string,
  db: any,
  tiles: Tile[],
  removedTileIds: Set<string>,
  setRemovedTileIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  movedCards: any,
  removedCardIds: any,
  setRemovedCardIds: React.Dispatch<React.SetStateAction<any>>,
  workspaceId: string
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);
    if (ownerUsername) {
      const tileCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "tiles"
      );

      // Save new and updated tiles and cards
      for (const tile of tiles) {
        let tileRef;
        if (tile.id.startsWith("temp-")) {
          tileRef = doc(tileCollection);
          batch.set(tileRef, { name: tile.name, position: tile.position });
          tile.id = tileRef.id;
        } else {
          tileRef = doc(tileCollection, tile.id);
          batch.update(tileRef, { name: tile.name, position: tile.position });
        }

        const cardCollection = collection(tileRef, "cards");
        for (const card of tile.cards) {
          if (card.id.startsWith("temp-")) {
            const cardDocRef = doc(cardCollection);
            card.id = cardDocRef.id;
            batch.set(cardDocRef, card);
          } else {
            const cardRef = doc(cardCollection, card.id);
            const cardDoc = await getDoc(cardRef);
            if (cardDoc.exists()) {
              batch.update(cardRef, card);
            } else {
              batch.set(cardRef, card);
            }
          }
        }
      }

      // Delete moved cards from their original tiles
      for (const cardId in movedCards) {
        const originalTileId = movedCards[cardId];
        const tileRef = doc(tileCollection, originalTileId);
        const cardCollection = collection(tileRef, "cards");
        const cardRef = doc(cardCollection, cardId);
        batch.delete(cardRef);
      }

      // Delete removed cards
      for (const tileId in removedCardIds) {
        const tileRef = doc(tileCollection, tileId);
        const cardCollection = collection(tileRef, "cards");
        for (const cardId of removedCardIds[tileId]) {
          const cardRef = doc(cardCollection, cardId);
          batch.delete(cardRef);
        }
      }

      removedTileIds.forEach((id) => {
        const tileRef = doc(
          db,
          "users",
          ownerUsername,
          "workspaces",
          workspaceId,
          "tiles",
          id as string
        );
        batch.delete(tileRef);
      });

      await batch.commit();
      setRemovedTileIds(new Set());
      setRemovedCardIds({});
      setIsSaving(false);
      setHasSavedOnce(true);
    }
  };

  return { isSaving, hasSavedOnce, handleSave };
};
