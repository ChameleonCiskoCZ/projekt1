"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import firebase_app from "@/firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ReactDOM from "react-dom";

type Tile = {
  id: string;
  name: string;
  position: number;
};

export default function MainApp() {
  const [name, setName] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const db = getFirestore(firebase_app);
  const userRef = doc(db, "users", "test"); // replace 'test' with the actual username
  const tilesCollectionRef = collection(userRef, "tiles");
  const [removedTileIds, setRemovedTileIds] = useState(new Set());
  const [isClicked, setIsClicked] = useState(false);

  // Fetch tiles from Firebase on initial render
  useEffect(() => {
    const fetchTiles = async () => {
      const tileCollection = collection(db, "users", "test", "tiles");
      const tileSnapshot = await getDocs(tileCollection);
      const tiles = tileSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Tile)
      );
      setTiles(tiles);
    };

    fetchTiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setIsClicked(false);
  };

  const handleRemoveTile = (id: string) => {
    // Remove the tile locally
    const newTiles = tiles.filter((tile) => tile.id !== id);
    setTiles(newTiles);

    setRemovedTileIds((prev) => new Set(prev).add(id));
  };

  // Add a new state variable for the id of the tile that is being edited
  const [editingTileId, setEditingTileId] = useState<string | null>(null);

  // Add a new state variable for the new name of the tile that is being edited
  const [newName, setNewName] = useState("");

  // ...existing code...

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

  // Add a new state variable for the id of the tile that has its menu open
  const [openTileId, setOpenTileId] = useState<string | null>(null);

  // Add a ref for the menu and the button
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Add an effect to add the event listener when the component mounts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenTileId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleButtonClick = (id: string, event: React.MouseEvent) => {
    const rect = (event.target as Element).getBoundingClientRect();
    setOpenTileId(id);
    setMenuPosition({
      top: rect.top,
      left: rect.left,
    });
  };

  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tileRef.current && !tileRef.current.contains(event.target as Node)) {
        setIsClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const resizeTextArea = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "32px";
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

  return (
    <div className="min-h-screen bg-gray-100">
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
                      <>
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-2 bg-white rounded-2xl shadow m-2 w-64 relative flex flex-col"
                        >
                          {/* Add the ref to the button */}
                          <div className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-10">
                              {editingTileId === tile.id ? (
                                <textarea
                                  ref={textareaRef}
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  onBlur={() => handleNameChange(tile.id)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleNameChange(tile.id)
                                  }
                                  autoFocus
                                  className="text-xl resize-none w-full p-0.5 pl-2 font-bold overflow-hidden break-words rounded-xl flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <div
                                  className="text-xl p-0.5 pl-2 mr-2 font-bold break-words cursor-pointer overflow-auto whitespace-normal min-w-0"
                                  onClick={() => {
                                    setEditingTileId(tile.id);
                                    setNewName(tile.name || "");
                                  }}
                                >
                                  <h2>{tile.name || "Click to edit"}</h2>
                                </div>
                              )}
                            </div>
                            <button
                              ref={buttonRef}
                              onClick={(event) =>
                                handleButtonClick(tile.id, event)
                              }
                              className="col-span-2 text-xl p-2.5 rounded-xl hover:bg-gray-100 justify-self-end box-content hover:outline-none hover:ring-2 hover:ring-blue-500"
                            >
                              <span className="w-4 h-0.5 bg-black block mb-1 rounded-full"></span>
                              <span className="w-4 h-0.5 bg-black block mb-1 rounded-full"></span>
                              <span className="w-4 h-0.5 bg-black block rounded-full"></span>
                            </button>
                          </div>
                        </div>
                        {/* Only show the menu if the openTileId matches the id of this tile */}
                        {openTileId === tile.id &&
                          ReactDOM.createPortal(
                            <div
                              ref={menuRef}
                              style={{
                                position: "fixed",
                                ...menuPosition,
                              }}
                              className="mt-10 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                            >
                              <div
                                className="py-1"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="options-menu"
                              >
                                <button
                                  onClick={() => handleRemoveTile(tile.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>,
                            document.body
                          )}
                      </>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
              <div
                ref={tileRef}
                onClick={(event) => {
                  if (
                    buttonRef.current &&
                    buttonRef.current.contains(event.target as Node)
                  ) {
                    return;
                  }
                  event.stopPropagation();
                  setIsClicked(true);
                }}
                className={`p-4 rounded-2xl shadow m-2 w-64 relative ${
                  isClicked
                    ? "bg-white"
                    : "bg-white bg-opacity-40 hover:bg-white hover:bg-opacity-70"
                } ${isClicked ? "h-auto" : "min-h-20"} ${
                  isClicked ? "" : "flex items-center justify-center"
                }`}
              >
                {isClicked ? (
                  <div className="flex flex-col">
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mb-2 px-2 py-1 border-2 border-gray-200 rounded-xl w-full"
                    />
                    <button
                      ref={buttonRef}
                      onClick={handleAddTile}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl w-full"
                    >
                      Add Tile
                    </button>
                  </div>
                ) : (
                  <p className="text-4xl">+</p>
                )}
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
