import { useState, useEffect, RefObject } from "react";
import { Tile } from "../page";

export const useAddTile = (tiles: Tile[], setTiles: (tiles: Tile[]) => void, tileRef: RefObject<HTMLDivElement>) => {
  const [name, setName] = useState("");
  const [isClicked, setIsClicked] = useState(false);
  // Add an effect to close the menu when clicking outside tile
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

  return {
    name,
    setName,
    isClicked,
    setIsClicked,
    handleAddTile,
  };
};
