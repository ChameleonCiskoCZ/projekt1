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
import ReactDOM from "react-dom";

type Card = {
  id: string;
  name: string;
  position: number;
};

type Tile = {
  id: string;
  name: string;
  position: number;
  cards: Card[];
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
    };

    fetchTiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTile = () => {
    const newPosition = tiles.length;
    const newTile = {
      name,
      position: newPosition,
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      cards: [],
    };
    setName("");
    // Add the new tile locally
    setTiles([...tiles, newTile]);
    setIsClicked(false);
  };

  // Update the handleRemoveTile function
  const handleRemoveTile = (id: string) => {
    setTiles(tiles.filter((tile) => tile.id !== id));
    setRemovedTileIds((prev) => new Set(prev).add(id));
  };

  const [expandedTileId, setExpandedTileId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const addCardRef = useRef<HTMLDivElement>(null);

  const handleAddCardClick = (tileId: string) => {
    setExpandedTileId(tileId);
  };

  // Add a new card to a tile
  const handleAddCard = (tileId: string, event: React.MouseEvent) => {
    // Find the tile to which the card will be added
    const tile = tiles.find((tile) => tile.id === tileId);
    // Determine the position for the new card
    const newPosition = tile ? tile.cards.length : 0;

    if (newCardName.trim() !== "") {
      // Create a new card
      const newCard = {
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        name: newCardName,
        position: newPosition,
      };

      // Add the card to the tile
      setTiles((prevTiles) =>
        prevTiles.map((tile) =>
          tile.id === tileId
            ? { ...tile, cards: [...tile.cards, newCard] }
            : tile
        )
      );

      // Reset the state
      setNewCardName("");
      setExpandedTileId(null);
    }
  };
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

  // Clicking outside to close the form
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        addCardRef.current &&
        !addCardRef.current.contains(event.target as Node)
      ) {
        setExpandedTileId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addCardRef]);

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

  const handleDragEnd = (result:any) => {
    const { source, destination, draggableId, type } = result;

    // Ignore drops outside of a droppable area
    if (!destination) {
      return;
    }

    if (type === "tile") {
      // Handle tile reordering
      const newTiles = Array.from(tiles);
      const [removed] = newTiles.splice(source.index, 1);
      newTiles.splice(destination.index, 0, removed);

      // Update the position of each tile
      newTiles.forEach((tile, index) => {
        tile.position = index;
      });

      setTiles(newTiles);
    } else {
      // Handle card reordering
      const startTileId = source.droppableId.split("-")[1];
      const endTileId = destination.droppableId.split("-")[1];

      const startTile = tiles.find((tile) => tile.id === startTileId);
      const endTile = tiles.find((tile) => tile.id === endTileId);

      // Check if startTile and endTile are not undefined
      if (!startTile || !endTile) {
        throw new Error("Tile not found");
      }

      // Moving within the same tile
      if (startTileId === endTileId) {
        const newCards = Array.from(startTile.cards);
        const [removed] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, removed);

        // Update the position of each card
        newCards.forEach((card, index) => {
          card.position = index;
        });

        startTile.cards = newCards;
      } else {
        // Moving to a different tile
        const startCards = Array.from(startTile.cards);
        const [removed] = startCards.splice(source.index, 1);
        const endCards = Array.from(endTile.cards);
        endCards.splice(destination.index, 0, removed);

        // Update the position of each card in the start and end tiles
        startCards.forEach((card, index) => {
          card.position = index;
        });
        endCards.forEach((card, index) => {
          card.position = index;
        });

        startTile.cards = startCards;
        endTile.cards = endCards;
      }

      setTiles([...tiles]);
    }
  };

  const handleSave = async () => {
    const batch = writeBatch(db);
    const tileCollection = collection(db, "users", "test", "tiles");

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

    for (const tileId in removedCardIds) {
      const tileRef = doc(tileCollection, tileId);
      const cardCollection = collection(tileRef, "cards");
      for (const cardId of removedCardIds[tileId]) {
        const cardRef = doc(cardCollection, cardId);
        batch.delete(cardRef);
      }
    }

    removedTileIds.forEach((id) => {
      const tileRef = doc(db, "users", "test", "tiles", id as string);
      batch.delete(tileRef);
    });

    await batch.commit();
    setRemovedTileIds(new Set());
    setRemovedCardIds({});
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

  return (
    <div className="min-h-screen bg-gray-100">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-tiles" direction="horizontal" type="tile">
          {(provided) => (
            <div
              className="flex"
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
                          className="p-2 bg-white flex-shrink-0 rounded-2xl shadow m-2 w-64 relative flex flex-col self-start"
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
                                  className="text-xl p-0.5 pl-2 mr-2 font-bold break-words cursor-pointer"
                                  onClick={() => {
                                    setEditingTileId(tile.id);
                                    setNewName(tile.name || "");
                                  }}
                                >
                                  <h2>{tile.name || "edit"}</h2>
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
                          <div>
                            <Droppable
                              droppableId={`tile-${tile.id}`}
                              type="card"
                            >
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                >
                                  {tile.cards
                                    .sort((a, b) => a.position - b.position) // Sort the cards by position
                                    .map((card, cardIndex) => (
                                      <Draggable
                                        key={card.id}
                                        draggableId={card.id}
                                        index={cardIndex}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="shadow bg-gray-100 bg-opacity-40 p-2 rounded-xl mt-2 backdrop-blur relative"
                                          >
                                            <h3 className="text-lg font-semibold">
                                              {card.name}
                                            </h3>
                                            <button
                                              onClick={() =>
                                                handleRemoveCard(
                                                  tile.id,
                                                  card.id
                                                )
                                              }
                                              className="absolute top-0 right-0 mt-2 mr-2 rounded-xl p-1 hover:bg-red-600"
                                            >
                                              X
                                            </button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                            {expandedTileId === tile.id ? (
                              <div ref={addCardRef}>
                                <input
                                  type="text"
                                  value={newCardName}
                                  onChange={(e) =>
                                    setNewCardName(e.target.value)
                                  }
                                  className="mt-2 border rounded-xl p-2"
                                />
                                <button
                                  onClick={(event) =>
                                    handleAddCard(tile.id, event)
                                  }
                                  className="mt-2 bg-blue-500 text-white rounded-xl p-2 hover:bg-blue-600"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddCardClick(tile.id)}
                                className="w-full mt-2 rounded-xl p-2 shadow bg-gray-100 bg-opacity-10 hover:bg-gray-20 hover:bg-opacity-70"
                              >
                                <span className="text-2xl">+</span>
                              </button>
                            )}
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
                              className="mt-10 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                            >
                              <div
                                className="py-1"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="options-menu"
                              >
                                <button
                                  onClick={() => handleRemoveTile(tile.id)}
                                  className="block w-full rounded-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                className={`self-start p-4 rounded-2xl shadow m-2 w-64 flex-shrink-0 relative ${
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
