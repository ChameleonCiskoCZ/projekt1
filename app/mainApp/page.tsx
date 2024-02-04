"use client";
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import firebase_app from "@/firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type Tile = {
  id: string;
  name: string;
  position: number;
};

export default function mainApp() {
  const [name, setName] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [originalTiles, setOriginalTiles] = useState<Tile[]>([]);
  const db = getFirestore(firebase_app);
  const userRef = doc(db, "users", "test"); // replace 'test' with the actual username
  const tilesCollectionRef = collection(userRef, "tiles");
  const [removedTileIds, setRemovedTileIds] = useState(new Set());

  // Fetch tiles from Firebase on initial render
  useEffect(() => {
    const fetchTiles = async () => {
      const tileCollection = collection(db, "users", "test", "tiles");
      const tileSnapshot = await getDocs(tileCollection);
      const tiles = tileSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Tile)
      );
      setTiles(tiles);
      setOriginalTiles(tiles);
    };

    fetchTiles();
  }, []);

  const handleAddTile = () => {
    const newPosition = tiles.length;
    const newTile = {
      name,
      position: newPosition,
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
    };
    setName("");
    // Add the new tile locally
    setTiles([...tiles, newTile]);
  };

  const handleRemoveTile = (id: string) => {
    // Remove the tile locally
    const newTiles = tiles.filter((tile) => tile.id !== id);
    setTiles(newTiles);

    setRemovedTileIds((prev) => new Set(prev).add(id));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    // Reorder the tiles locally
    const items = Array.from(tiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the position property of each tile
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setTiles(updatedItems);
  };

  const handleSave = async () => {
    // Update the tiles in Firestore
    const batch = writeBatch(db);
    const tileCollection = collection(db, "users", "test", "tiles");

    for (const tile of tiles) {
      if (tile.id.startsWith("temp-")) {
        // The tile is new, so add it to Firestore
        const tileDocRef = doc(tileCollection);
        batch.set(tileDocRef, { name: tile.name, position: tile.position });
        // Update the ID of the tile in the local state
        tile.id = tileDocRef.id;
      } else {
        // The tile already exists, so update it in Firestore
        const tileRef = doc(tileCollection, tile.id);
        batch.update(tileRef, tile);
      }
    }

    // Handle removed tiles
    removedTileIds.forEach((id) => {
      const tileRef = doc(db, "users", "test", "tiles", id as string);
      batch.delete(tileRef);
    });

    await batch.commit();
    setRemovedTileIds(new Set());
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tiles" direction="horizontal">
          {(provided) => (
            <div
              className="grid grid-flow-col auto-cols-max"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {tiles
                .sort((a, b) => a.position - b.position)
                .map((tile, index) => (
                  <Draggable key={tile.id} draggableId={tile.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 bg-white rounded shadow m-2 min-w-64 overflow-hidden relative"
                      >
                        <button
                          onClick={() => handleRemoveTile(tile.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded p-1"
                        >
                          Remove
                        </button>
                        <h2 className="text-xl font-bold break-words">
                          {tile.name}
                        </h2>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
              <div className="p-4 bg-white rounded shadow m-2 min-w-64">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-2 mb-4 border-2 border-gray-300 rounded w-full"
                />
                <button
                  onClick={handleAddTile}
                  className="p-2 mb-4 bg-blue-500 text-white rounded w-full"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <button
        onClick={handleSave}
        className="p-2 mt-4 bg-green-500 text-white rounded w-full"
      >
        Save
      </button>
    </div>
  );
}
