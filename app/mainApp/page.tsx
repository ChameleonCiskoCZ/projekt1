"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import firebase_app from "@/firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Cards } from "./_components/cards";
import { TileMenu } from "./_components/tileMenu";
import { AddCard } from "./_components/addCard";
import { AddTile } from "./_components/addTile";
import { useAddCard } from "./_hooks/useAddCard";
import { useTileMenu } from "./_hooks/useTileMenu";
import { useAddTile } from "./_hooks/useAddTile";
import { Tiles } from "./_components/tiles";
import { useHandleDrag } from "./_hooks/useHandleDrag";

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
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebase_app);
  const [username, setUsername] = useState<string | null>(null);

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
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps


  const [removedCardIds, setRemovedCardIds] = useState<{
    [tileId: string]: string[];
  }>({});
  const handleRemoveCard = (tileId: string, cardId: string) => {
    setTiles((prevTiles) =>
      prevTiles.map((tile) =>
        tile.id === tileId
          ? { ...tile, cards: tile.cards.filter((card) => card.id !== cardId) }
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

  // Add a new state variable for the id of the tile that is being edited
  const [editingTileId, setEditingTileId] = useState<string | null>(null);

  // Add a new state variable for the new name of the tile that is being edited
  const [newName, setNewName] = useState("");

  // Update the name of the tile
  const handleNameChange = (id: string) => {
    // Update the name of the tile in the state
    const newTiles = tiles.map((tile) =>
      tile.id === id ? { ...tile, name: newName } : tile
    );
    setTiles(newTiles);

    // Clear the editing state
    setEditingTileId(null);
    setNewName("");
  };

  


  const { handleDragEnd, isDragging, movedCards } = useHandleDrag(
    tiles,
    setTiles,
  );
  

  const handleSave = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);
    if (username) {
      const tileCollection = collection(db, "users", username, "tiles");

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
        const tileRef = doc(db, "users", username, "tiles", id as string);
        batch.delete(tileRef);
      });

      await batch.commit();
      setRemovedTileIds(new Set());
      setRemovedCardIds({});
      setIsSaving(false);
      setHasSavedOnce(true);
    }
  };
  const tileRef = useRef<HTMLDivElement>(null);

  

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add an effect to resize the textarea
  useEffect(() => {
    const resizeTextArea = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "28px";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (textareaRef.current) {
      textareaRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [newName]);

  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const resizeTextArea = () => {
      if (descriptionRef.current) {
        descriptionRef.current.style.height = "128px";
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (descriptionRef.current) {
      descriptionRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (descriptionRef.current) {
          descriptionRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [selectedCard?.description, isModalOpen]);

  const nameRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const resizeTextArea = () => {
      if (nameRef.current) {
        nameRef.current.style.height = "28px";
        nameRef.current.style.height = `${nameRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (nameRef.current) {
      nameRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (nameRef.current) {
          nameRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [selectedCard?.name, isModalOpen]);

  const [showSaved, setShowSaved] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

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
        tileRef={tileRef}
        setSelectedTile={setSelectedTile}
        setSelectedCard={setSelectedCard}
        setIsModalOpen={setIsModalOpen}
        editingTileId={editingTileId}
        setEditingTileId={setEditingTileId}
        newName={newName}
        setNewName={setNewName}
        handleNameChange={handleNameChange}
        textareaRef={textareaRef}
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
      {isModalOpen && selectedCard && selectedTile && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white  rounded-2xl p-2 shadow flex flex-col"
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
                className="m-1 p-4 ml-4 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100"
                onClick={() => setIsModalOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="flex justify-between space-x-16 items-start">
              <div className="p-2">
                <label className="text-lg pl-1 font-bold">Description</label>
                <textarea
                  ref={descriptionRef}
                  className="mt-2 resize-none rounded-xl p-2 w-full overflow-hidden h-20 border border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" // Added "resize-none" to prevent resizing
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
              </div>
              <div className="mt-10">
                <button
                  className="m-1 p-2 bg-red-300 hover:bg-red-500 text-white rounded-lg"
                  onClick={() => {
                    // Add your remove logic here
                    handleRemoveCard(selectedTile.id, selectedCard.id);
                    setIsModalOpen(false);
                  }}
                >
                  Remove Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
