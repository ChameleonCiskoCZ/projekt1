import { useContext, useRef } from "react";
import { Tile } from "../page"; // adjust the path according to your directory structure
import { writeBatch, collection, doc, getDoc } from "firebase/firestore"; // adjust the path according to your directory structure
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";

interface MovedCards {
  [key: string]: string;
}

interface RemovedCardIds {
  [key: string]: string[];
}

export const useSave = (
  ownerUsername: string,
  db: any,
  tiles: Tile[],
  removedTileIds: Set<string>,
  setRemovedTileIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  movedCards: MovedCards,
  removedCardIds: RemovedCardIds,
  setRemovedCardIds: React.Dispatch<React.SetStateAction<RemovedCardIds>>,
  workspaceId: string
) => {
  const { notify } = useContext(NotificationContext);
  const isSaving = useRef(false);

  const saveTile = async (batch: any, tile: Tile, tileCollection: any) => {
    let tileRef;
    if (tile.id.startsWith("temp-")) {
      tileRef = doc(tileCollection);
      batch.set(tileRef, { name: tile.name, position: tile.position });
      tile.id = tileRef.id;
    } else {
      tileRef = doc(tileCollection, tile.id);
      batch.update(tileRef, { name: tile.name, position: tile.position });
    }
    return tileRef;
  };

  const saveCards = async (batch: any, tileRef: any, cards: any[]) => {
    const cardCollection = collection(tileRef, "cards");
    for (const card of cards) {
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
  };

  const handleSave = async () => {
    if (isSaving.current) return; // Prevent concurrent saves
    isSaving.current = true;

    //notify("Saving...", "success");
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

      try {
        // Save new and updated tiles and cards
        for (const tile of tiles) {
          const tileRef = await saveTile(batch, tile, tileCollection);
          await saveCards(batch, tileRef, tile.cards);
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

        // Delete removed tiles
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
        //notify("Saved successfully!", "success");
      } catch (error) {
        console.error("Error saving data:", error);
        //notify("Error saving data. Please try again.", "error");
      } finally {
        isSaving.current = false;
      }
    }
  };

  return { handleSave };
};
