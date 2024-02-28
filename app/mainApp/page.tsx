"use client";
import React, { useState, useEffect, useRef } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Tiles } from "./_components/tiles/tiles";
import { useHandleDrag } from "./_hooks/useHandleDrag";
import { useTileNameChange } from "./_hooks/tiles/useTileNameChange";
import { useSave } from "./_hooks/useSave";
import { CardModal } from "./_components/cards/cardModal";
import { useRemoveCard } from "./_hooks/cards/useRemoveCard";

// Define the types for the cards and tiles
export type Card = {
  id: string;
  name: string;
  position: number;
  description: string;
};

export type Tile = {
  id: string;
  name: string;
  position: number;
  cards: Card[];
};

export default function MainApp() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const db = getFirestore(firebase_app);
  const [removedTileIds, setRemovedTileIds] = useState<Set<string>>(new Set());

  const router = useRouter();
  const auth = getAuth(firebase_app);
  const [username, setUsername] = useState<string | null>(null);

  //modal consts idk
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set up a subscription to the auth object
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName);
      } else {
        setUsername(null);
        router.push("/login");
      }
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

  // Fetch tiles from Firebase on initial render
  useEffect(() => {
    const fetchTiles = async () => {
      if (username) {
        // Fetch the user's document from the users collection
        const tileCollection = collection(db, "users", username, "tiles");

        const tileSnapshot = await getDocs(tileCollection);
        const tiles = await Promise.all(
          tileSnapshot.docs.map(async (doc) => {
            const tileData = doc.data();
            const cardCollection = collection(tileCollection, doc.id, "cards");
            const cardSnapshot = await getDocs(cardCollection);
            const cards = cardSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Card)
            );
            return { id: doc.id, ...tileData, cards } as Tile;
          })
        );
        setTiles(tiles);
      }
    };

    fetchTiles();
  }, [username]); 


  const { removedCardIds, setRemovedCardIds, handleRemoveCard } = useRemoveCard(setTiles);

  //handle dragging
  const { handleDragEnd, isDragging, movedCards } = useHandleDrag(
    tiles,
    setTiles
  );

  //save in firebase
  const { isSaving, hasSavedOnce, handleSave } = useSave(
    username || "",
    db,
    tiles,
    removedTileIds,
    setRemovedTileIds,
    movedCards,
    removedCardIds,
    setRemovedCardIds
  );


  const [showSaved, setShowSaved] = useState(false);

  //timeout to show saved message
  useEffect(() => {
    let timeoutId: any;
    if (!isSaving && hasSavedOnce) {
      setShowSaved(true);
      timeoutId = setTimeout(() => setShowSaved(false), 3000); // 3000ms = 3s
    }
    return () => clearTimeout(timeoutId);
  }, [isSaving, hasSavedOnce]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div>
        {/* ...rest of your component... */}
        {isSaving && (
          <div className="fixed bottom-4 right-4 w-40 z-50 px-20 py-4 bg-gray-300 rounded-2xl flex items-center justify-center">
            Saving
          </div>
        )}
        {!isSaving && showSaved && (
          <div className="fixed bottom-4 right-4 w-40 z-50 px-20 py-4 bg-green-300 rounded-2xl flex items-center justify-center">
            Saved!
          </div>
        )}
      </div>

      <Tiles
        tiles={tiles}
        setTiles={setTiles}
        handleDragEnd={handleDragEnd}
        removedTileIds={removedTileIds}
        setRemovedTileIds={setRemovedTileIds}
        setSelectedTile={setSelectedTile}
        setSelectedCard={setSelectedCard}
        setIsModalOpen={setIsModalOpen}
      />

      <div className="fixed bottom-0 left-0 w-full flex justify-center pb-4">
        <button
          disabled={isDragging}
          onClick={handleSave}
          className={`p-4 w-40 mt-4 text-white rounded-2xl bg-green-400 ${
            isDragging ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          Save
        </button>
      </div>
      <CardModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        selectedTile={selectedTile}
        tiles={tiles}
        handleRemoveCard={handleRemoveCard}
      />
    </div>
  );
}
