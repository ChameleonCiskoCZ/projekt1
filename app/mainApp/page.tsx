"use client"
import React, { useState, useEffect } from "react";
import { getFirestore} from "firebase/firestore";
import firebase_app from "@/firebase";
import { addDoc, collection, doc, onSnapshot } from "firebase/firestore";

export default function mainApp() {
  const [name, setName] = useState("");
  const [tiles, setTiles] = useState<{ id: string }[]>([]);;
  const db = getFirestore(firebase_app);
  const userRef = doc(db, "users", "test"); // replace 'test' with the actual username
  const tilesCollectionRef = collection(userRef, "tiles");

  useEffect(() => {
    const userRef = doc(db, "users", "test"); // replace 'test' with the actual username
    const tilesCollectionRef = collection(userRef, "tiles");

    const unsubscribe = onSnapshot(tilesCollectionRef, (snapshot) => {
      const newTiles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    setTiles(newTiles);
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleAddTile = async () => {
    await addDoc(tilesCollectionRef, { name });
    setName("");
  };

  return (
    <div className="flex flex-row overflow-x-auto">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className="p-4 bg-white rounded shadow m-2 min-w-64 overflow-hidden"
        >
          <h2 className="text-xl font-bold break-words">{tile.name}</h2>
        </div>
      ))}
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
  );
};
